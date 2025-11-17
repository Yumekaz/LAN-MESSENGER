import React, { useState } from 'react';

function HomePage({ username, onCreateRoom, onJoinRoom }) {
  const [roomCode, setRoomCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (roomCode.trim().length === 6) {
      onJoinRoom(roomCode.trim().toUpperCase());
      setRoomCode('');
      setShowJoinInput(false);
    }
  };

  return (
    <div className="page home-page">
      <div className="card">
        <div className="header">
          <h2>Welcome, {username}!</h2>
          <p className="subtitle">Create a private room or join an existing one</p>
        </div>

        <div className="actions">
          <button className="btn btn-primary btn-large" onClick={onCreateRoom}>
            <span className="btn-icon">➕</span>
            Create New Room
          </button>

          {!showJoinInput ? (
            <button
              className="btn btn-secondary btn-large"
              onClick={() => setShowJoinInput(true)}
            >
              <span className="btn-icon">🔑</span>
              Join Existing Room
            </button>
          ) : (
            <form onSubmit={handleJoinSubmit} className="join-form">
              <input
                type="text"
                className="input"
                placeholder="Enter 6-digit room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength="6"
                autoFocus
              />
              <div className="button-group">
                <button type="submit" className="btn btn-primary">
                  Join
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowJoinInput(false);
                    setRoomCode('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="info-box">
          <h3>How it works:</h3>
          <ol>
            <li>Create a room to generate a QR code</li>
            <li>Share the QR code or room code with others</li>
            <li>Approve join requests from users</li>
            <li>Start chatting in your private room!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
