# Local Network Chat

A modern, offline-first messaging platform designed for secure communication over a local Wi-Fi network. Create private rooms, invite users via QR codes, and chat in real time—no internet required.

---

## Features

- Offline-First — Works entirely on local Wi-Fi
- Private Rooms — Isolated chat environments
- QR Code Invites — Scannable, instant room sharing
- Join Request Approval — Room owners approve all joins
- Real-Time Messaging — Instant updates with typing indicators
- Multi-Room Support — Create or join multiple rooms
- Responsive UI — Optimized for mobile and desktop

---

## Quick Start

### Prerequisites

- Node.js 16+
- npm
- Devices connected to the same Wi-Fi network

---

## Installation

```bash
git clone <your-repo-url>
cd local-network-chat
npm run prepare:run
```

### Start the Server

```bash
npm start
```

Once running, the terminal will display:

```
Local URL: http://localhost:3000
LAN URL: http://<your-ip>:3000
```

---

## Usage

Open the LAN URL on the host device.

Enter a unique username.

Create a new room.

Share the QR code or 6-digit room code.

Approve join requests.

Start chatting.

---

## Device Access

Host Device: http://localhost:3000

Other LAN Devices: http://<host-ip>:3000

QR Code: Scan to join instantly

---

## Architecture

Backend: Node.js, Express, Socket.IO  
Frontend: React, Vite  
Styling: Utility-style modern CSS  
Real-Time: Socket.IO rooms for isolated communication

---

## Project Structure

```
local-network-chat/
├── server.js             # Express + Socket.IO backend
├── package.json          # Root config
├── client/               # React frontend
│   ├── src/
│   │   ├── pages/        # UI pages
│   │   ├── components/   # Reusable components
│   │   └── socket.js     # Socket.IO client wrapper
│   └── package.json
└── public_build/         # Production frontend build
```

---

## Development

Install client dependencies:

```bash
npm run client:install
```

Build the client:

```bash
npm run client:build
```

Start the server:

```bash
npm start
```

---

## Troubleshooting

### Cannot connect from other devices?
- Ensure all devices are on the same Wi-Fi network.
- Allow Node.js through the firewall on port 3000.
- Confirm the correct LAN IP address.

### Username taken?
- Usernames must be unique across connected clients.
- Choose another username or wait for the conflicting user to disconnect.

### Join request not appearing?
- Confirm the room code is correct (6 characters).
- Ensure the room owner is online.
- Verify both devices have stable network connections.
