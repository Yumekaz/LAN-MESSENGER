import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket';

function RoomPage({ roomId, username, isOwner, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Join room and request data
    socket.emit('join-room', { roomId });

    // Socket listeners
    socket.on('room-data', ({ members: roomMembers, messages: roomMessages }) => {
      setMembers(roomMembers);
      setMessages(roomMessages);
    });

    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('user-typing', ({ username: typingUser }) => {
      setTypingUsers(prev => new Set(prev).add(typingUser));
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(typingUser);
          return newSet;
        });
      }, 3000);
    });

    socket.on('user-joined', ({ username: joinedUser }) => {
      setMessages(prev => [...prev, {
        type: 'system',
        text: `${joinedUser} joined the room`,
        timestamp: Date.now()
      }]);
    });

    socket.on('user-left', ({ username: leftUser }) => {
      setMessages(prev => [...prev, {
        type: 'system',
        text: `${leftUser} left the room`,
        timestamp: Date.now()
      }]);
    });

    socket.on('members-update', ({ members: updatedMembers }) => {
      setMembers(updatedMembers);
    });

    return () => {
      socket.off('room-data');
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('members-update');
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      socket.emit('send-message', { roomId, text: inputText.trim() });
      setInputText('');
    }
  };

  const handleTyping = () => {
    socket.emit('typing', { roomId });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page room-page">
      <div className="room-container">
        {/* Header */}
        <div className="room-header">
          <div className="room-info">
            <h3>Chat Room</h3>
            <span className="member-count">{members.length} members</span>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-icon"
              onClick={() => setShowMembers(!showMembers)}
            >
              👥
            </button>
            <button className="btn btn-danger" onClick={onLeave}>
              Leave
            </button>
          </div>
        </div>

        <div className="room-content">
          {/* Messages Area */}
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${
                  msg.type === 'system'
                    ? 'system-message'
                    : msg.username === username
                    ? 'own-message'
                    : 'other-message'
                }`}
              >
                {msg.type !== 'system' && (
                  <div className="message-header">
                    <span className="message-username">{msg.username}</span>
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                )}
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            
            {typingUsers.size > 0 && (
              <div className="typing-indicator">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}
          </div>

          {/* Members Sidebar (Mobile: Overlay) */}
          {showMembers && (
            <div className="members-sidebar" onClick={() => setShowMembers(false)}>
              <div className="members-panel" onClick={(e) => e.stopPropagation()}>
                <h4>Members ({members.length})</h4>
                <ul className="members-list">
                  {members.map((member) => (
                    <li key={member} className="member-item">
                      <span className="member-status"></span>
                      {member}
                      {member === username && <span className="you-badge"> (You)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form className="message-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="input message-input"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleTyping}
          />
          <button type="submit" className="btn btn-primary">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default RoomPage;
