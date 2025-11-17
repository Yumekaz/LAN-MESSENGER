import React, { useState, useEffect } from 'react';
import socket from './socket';
import UsernamePage from './pages/UsernamePage';
import HomePage from './pages/HomePage';
import QRPage from './pages/QRPage';
import RoomPage from './pages/RoomPage';
import JoinRequestModal from './components/JoinRequestModal';
import Toast from './components/Toast';

function App() {
  const [currentPage, setCurrentPage] = useState('username'); // username | home | qr | room
  const [username, setUsername] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [toast, setToast] = useState(null);

  // Handle URL params for direct room join
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    
    if (roomCode && username && currentPage === 'home') {
      handleJoinRoom(roomCode);
    }
  }, [username, currentPage]);

  // Socket event listeners
  useEffect(() => {
    socket.on('username-accepted', ({ username: acceptedUsername }) => {
      setUsername(acceptedUsername);
      setCurrentPage('home');
      showToast('Welcome, ' + acceptedUsername + '!', 'success');
    });

    socket.on('username-taken', () => {
      showToast('Username already taken. Try another!', 'error');
    });

    socket.on('room-created', ({ roomId, roomCode, qrCodeUrl }) => {
      setCurrentRoom({ roomId, roomCode, qrCodeUrl, isOwner: true });
      setCurrentPage('qr');
    });

    socket.on('join-request', ({ requestId, username: requesterName, roomId }) => {
      setJoinRequests(prev => [...prev, { requestId, username: requesterName, roomId }]);
    });

    socket.on('join-approved', ({ roomId, roomCode }) => {
      setCurrentRoom({ roomId, roomCode, isOwner: false });
      setCurrentPage('room');
      showToast('Welcome to the room!', 'success');
    });

    socket.on('join-denied', () => {
      showToast('Join request denied by room owner', 'error');
    });

    socket.on('error', ({ message }) => {
      showToast(message, 'error');
    });

    return () => {
      socket.off('username-accepted');
      socket.off('username-taken');
      socket.off('room-created');
      socket.off('join-request');
      socket.off('join-approved');
      socket.off('join-denied');
      socket.off('error');
    };
  }, []);

  const handleRegisterUsername = (name) => {
    socket.emit('register-username', { username: name });
  };

  const handleCreateRoom = () => {
    socket.emit('create-room');
  };

  const handleJoinRoom = (roomCode) => {
    socket.emit('request-join', { roomCode });
    showToast('Join request sent...', 'info');
  };

  const handleApproveJoin = (requestId) => {
    socket.emit('approve-join', { requestId });
    setJoinRequests(prev => prev.filter(req => req.requestId !== requestId));
  };

  const handleDenyJoin = (requestId) => {
    socket.emit('deny-join', { requestId });
    setJoinRequests(prev => prev.filter(req => req.requestId !== requestId));
  };

  const handleEnterRoom = () => {
    setCurrentPage('room');
  };

  const handleLeaveRoom = () => {
    if (currentRoom) {
      socket.emit('leave-room', { roomId: currentRoom.roomId });
    }
    setCurrentRoom(null);
    setCurrentPage('home');
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="app">
      {currentPage === 'username' && (
        <UsernamePage onRegister={handleRegisterUsername} />
      )}
      
      {currentPage === 'home' && (
        <HomePage
          username={username}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      )}
      
      {currentPage === 'qr' && currentRoom && (
        <QRPage
          roomCode={currentRoom.roomCode}
          qrCodeUrl={currentRoom.qrCodeUrl}
          onEnterRoom={handleEnterRoom}
        />
      )}
      
      {currentPage === 'room' && currentRoom && (
        <RoomPage
          roomId={currentRoom.roomId}
          username={username}
          isOwner={currentRoom.isOwner}
          onLeave={handleLeaveRoom}
        />
      )}

      {joinRequests.length > 0 && (
        <JoinRequestModal
          requests={joinRequests}
          onApprove={handleApproveJoin}
          onDeny={handleDenyJoin}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
