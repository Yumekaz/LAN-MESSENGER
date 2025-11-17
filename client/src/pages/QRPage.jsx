import React, { useState } from 'react';

function QRPage({ roomCode, qrCodeUrl, onEnterRoom }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page qr-page">
      <div className="card">
        <h2>Room Created Successfully! 🎉</h2>
        <p className="subtitle">Share this code to invite others</p>

        <div className="qr-container">
          <img src={qrCodeUrl} alt="Room QR Code" className="qr-code" />
        </div>

        <div className="room-code-display">
          <span className="room-code">{roomCode}</span>
          <button
            className="btn btn-secondary btn-small"
            onClick={handleCopyCode}
          >
            {copied ? '✓ Copied!' : '📋 Copy Code'}
          </button>
        </div>

        <div className="info-box">
          <p>📱 Others can scan this QR code with their camera</p>
          <p>⌨️ Or manually enter the room code above</p>
          <p>✓ You'll receive a notification when someone wants to join</p>
        </div>

        <button className="btn btn-primary btn-large" onClick={onEnterRoom}>
          Enter Room
        </button>
      </div>
    </div>
  );
}

export default QRPage;
