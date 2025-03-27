import React from 'react';
import './ConfirmationBox.css';

function ConfirmationBox({ message, onConfirm, onCancel }) {
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-box">
        <p>{message}</p>
        <div className="confirmation-buttons">
          <button onClick={onCancel} className="cancel-button">Cancel</button>
          <button onClick={onConfirm} className="confirm-button">Yes</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationBox;
