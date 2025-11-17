const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const QRCode = require('qrcode');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// In-memory data stores
const users = new Map(); // socketId -> username
const usernames = new Set(); // Set of taken usernames
const rooms = new Map(); // roomId -> { owner, ownerSocketId, code, members: Set, messages: [] }
const joinRequests = new Map(); // requestId -> { username, roomId, socketId }
const socketToRooms = new Map(); // socketId -> Set of roomIds

let roomCounter = 0;
let requestCounter = 0;

// Utility: Generate 6-digit room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Utility: Get LAN IP
function getLanIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Serve static built frontend
app.use(express.static(path.join(__dirname, 'public_build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public_build', 'index.html'));
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`[CONNECT] Socket ${socket.id} connected`);

  // 1. Register username
  socket.on('register-username', ({ username }) => {
    if (usernames.has(username)) {
      socket.emit('username-taken');
      return;
    }

    users.set(socket.id, username);
    usernames.add(username);
    socketToRooms.set(socket.id, new Set());
    
    socket.emit('username-accepted', { username });
    console.log(`[USERNAME] ${username} registered (${socket.id})`);
  });

  // 2. Create room
  socket.on('create-room', async () => {
    const username = users.get(socket.id);
    if (!username) {
      socket.emit('error', { message: 'Username not registered' });
      return;
    }

    const roomId = `room_${++roomCounter}`;
    const roomCode = generateRoomCode();
    
    const room = {
      owner: username,
      ownerSocketId: socket.id,
      code: roomCode,
      members: new Set([username]),
      messages: []
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    socketToRooms.get(socket.id).add(roomId);

    // Generate QR code
    const lanIP = getLanIP();
    const joinUrl = `http://${lanIP}:${PORT}/?room=${roomCode}`;
    
    try {
      const qrCodeUrl = await QRCode.toDataURL(joinUrl);
      socket.emit('room-created', { roomId, roomCode, qrCodeUrl });
      console.log(`[ROOM] ${username} created room ${roomId} (${roomCode})`);
    } catch (err) {
      socket.emit('error', { message: 'Failed to generate QR code' });
    }
  });

  // 3. Request to join room
  socket.on('request-join', ({ roomCode }) => {
    const username = users.get(socket.id);
    if (!username) {
      socket.emit('error', { message: 'Username not registered' });
      return;
    }

    // Find room by code
    let targetRoom = null;
    let targetRoomId = null;

    for (const [roomId, room] of rooms.entries()) {
      if (room.code === roomCode) {
        targetRoom = room;
        targetRoomId = roomId;
        break;
      }
    }

    if (!targetRoom) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (targetRoom.members.has(username)) {
      socket.emit('error', { message: 'Already in room' });
      return;
    }

    const requestId = `req_${++requestCounter}`;
    joinRequests.set(requestId, {
      username,
      roomId: targetRoomId,
      socketId: socket.id
    });

    // Send join request to room owner
    io.to(targetRoom.ownerSocketId).emit('join-request', {
      requestId,
      username,
      roomId: targetRoomId
    });

    console.log(`[JOIN-REQ] ${username} requested to join ${targetRoomId}`);
  });

  // 4. Approve join request
  socket.on('approve-join', ({ requestId }) => {
    const request = joinRequests.get(requestId);
    if (!request) {
      socket.emit('error', { message: 'Request not found' });
      return;
    }

    const room = rooms.get(request.roomId);
    if (!room || room.ownerSocketId !== socket.id) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Add user to room
    room.members.add(request.username);
    
    const requesterSocket = io.sockets.sockets.get(request.socketId);
    if (requesterSocket) {
      requesterSocket.join(request.roomId);
      socketToRooms.get(request.socketId).add(request.roomId);

      // Notify requester
      requesterSocket.emit('join-approved', {
        roomId: request.roomId,
        roomCode: room.code
      });

      // Send room data to new member
      requesterSocket.emit('room-data', {
        members: Array.from(room.members),
        messages: room.messages
      });

      // Notify all room members
      io.to(request.roomId).emit('user-joined', { username: request.username });
      io.to(request.roomId).emit('members-update', { members: Array.from(room.members) });

      console.log(`[JOIN-APPROVED] ${request.username} joined ${request.roomId}`);
    }

    joinRequests.delete(requestId);
  });

  // 5. Deny join request
  socket.on('deny-join', ({ requestId }) => {
    const request = joinRequests.get(requestId);
    if (!request) return;

    const room = rooms.get(request.roomId);
    if (!room || room.ownerSocketId !== socket.id) return;

    const requesterSocket = io.sockets.sockets.get(request.socketId);
    if (requesterSocket) {
      requesterSocket.emit('join-denied');
    }

    joinRequests.delete(requestId);
    console.log(`[JOIN-DENIED] ${request.username} denied from ${request.roomId}`);
  });

  // 6. Join room (for already-approved members)
  socket.on('join-room', ({ roomId }) => {
    const username = users.get(socket.id);
    const room = rooms.get(roomId);

    if (!room || !username) {
      socket.emit('error', { message: 'Room or user not found' });
      return;
    }

    if (!room.members.has(username)) {
      socket.emit('error', { message: 'Not a member of this room' });
      return;
    }

    socket.join(roomId);
    socket.emit('room-data', {
      members: Array.from(room.members),
      messages: room.messages
    });
  });

  // 7. Send message
  socket.on('send-message', ({ roomId, text }) => {
    const username = users.get(socket.id);
    const room = rooms.get(roomId);

    if (!room || !username || !room.members.has(username)) {
      socket.emit('error', { message: 'Cannot send message' });
      return;
    }

    const message = {
      username,
      text,
      timestamp: Date.now()
    };

    room.messages.push(message);
    io.to(roomId).emit('new-message', message);
  });

  // 8. Typing indicator
  socket.on('typing', ({ roomId }) => {
    const username = users.get(socket.id);
    const room = rooms.get(roomId);

    if (room && username && room.members.has(username)) {
      socket.to(roomId).emit('user-typing', { username });
    }
  });

  // 9. Leave room
  socket.on('leave-room', ({ roomId }) => {
    const username = users.get(socket.id);
    const room = rooms.get(roomId);

    if (!room || !username) return;

    room.members.delete(username);
    socket.leave(roomId);
    socketToRooms.get(socket.id)?.delete(roomId);

    io.to(roomId).emit('user-left', { username });
    io.to(roomId).emit('members-update', { members: Array.from(room.members) });

    // If owner leaves, delete room
    if (room.ownerSocketId === socket.id) {
      rooms.delete(roomId);
      io.to(roomId).emit('error', { message: 'Room closed by owner' });
      console.log(`[ROOM-DELETED] ${roomId} closed by owner`);
    }

    console.log(`[LEAVE] ${username} left ${roomId}`);
  });

  // 10. Disconnect
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (!username) return;

    // Remove from all rooms
    const userRooms = socketToRooms.get(socket.id) || new Set();
    for (const roomId of userRooms) {
      const room = rooms.get(roomId);
      if (room) {
        room.members.delete(username);
        io.to(roomId).emit('user-left', { username });
        io.to(roomId).emit('members-update', { members: Array.from(room.members) });

        // Delete room if owner disconnects
        if (room.ownerSocketId === socket.id) {
          rooms.delete(roomId);
          io.to(roomId).emit('error', { message: 'Room closed' });
        }
      }
    }

    // Cleanup
    users.delete(socket.id);
    usernames.delete(username);
    socketToRooms.delete(socket.id);

    console.log(`[DISCONNECT] ${username} (${socket.id})`);
  });
});

// Start server
server.listen(PORT, () => {
  const lanIP = getLanIP();
  console.log('\n' + '='.repeat(60));
  console.log('🚀 LOCAL NETWORK CHAT SERVER RUNNING');
  console.log('='.repeat(60));
  console.log(`\n📱 Access on this device:\n   http://localhost:${PORT}\n`);
  console.log(`🌐 Access from other devices on your network:\n   http://${lanIP}:${PORT}\n`);
  console.log('📋 Instructions:');
  console.log('   1. Open the URL in your browser');
  console.log('   2. Choose a unique username');
  console.log('   3. Create a room and share the QR code');
  console.log('   4. Other users can scan the QR to join\n');
  console.log('⚠️  Make sure all devices are on the same Wi-Fi network!');
  console.log('='.repeat(60) + '\n');
});
