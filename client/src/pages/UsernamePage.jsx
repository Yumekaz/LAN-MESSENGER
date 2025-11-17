import React, { useState } from 'react';

function UsernamePage({ onRegister }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim().length >= 3) {
      onRegister(username.trim());
    }
  };

  return (
    <div className="page username-page">
      <div className="card">
        <div className="icon-wrapper">
          <span className="icon">💬</span>
        </div>
        <h1>Local Network Chat</h1>
        <p className="subtitle">Connect with others on your Wi-Fi network</p>
        
        <form onSubmit={handleSubmit} className="form">
          <input
            type="text"
            className="input"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength="3"
            maxLength="20"
            required
            autoFocus
          />
          <button type="submit" className="btn btn-primary">
            Continue
          </button>
        </form>
        
        <div className="info-box">
          <p>✓ Username must be 3-20 characters</p>
          <p>✓ Must be unique on the network</p>
        </div>
      </div>
    </div>
  );
}

export default UsernamePage;
