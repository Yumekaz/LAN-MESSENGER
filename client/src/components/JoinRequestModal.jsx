import React from 'react';

function JoinRequestModal({ requests, onApprove, onDeny }) {
  if (requests.length === 0) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Join Requests</h3>
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request.requestId} className="request-item">
              <div className="request-info">
                <span className="request-username">{request.username}</span>
                <span className="request-label">wants to join</span>
              </div>
              <div className="request-actions">
                <button
                  className="btn btn-success btn-small"
                  onClick={() => onApprove(request.requestId)}
                >
                  ✓ Accept
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => onDeny(request.requestId)}
                >
                  ✗ Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default JoinRequestModal;
