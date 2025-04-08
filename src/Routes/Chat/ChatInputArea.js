import React, { useRef } from 'react'
import { useSelector } from 'react-redux';

function ChatInputArea({
  lastSpokenTextRef,
  isSpeaking,
  isPaused,
  togglePause,
  handleSubmit
}) {
  const { settings } = useSelector(state => state.menu);
  const autoSendTimerRef = useRef(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      if (input) {
        handleSubmit();
      }
    }
  };

  const handleInputChange = () => {
    if (!settings.autoSendEnabled) return;

    const input = document.getElementById('chat-input');
    if (!input) return;

    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
    }

    console.log(settings.autoSendTimeout)

    const text = input.value.trim();
    if (text) {
      autoSendTimerRef.current = setTimeout(() => {
        handleSubmit();
      }, (settings.autoSendTimeout * 1000) || 5000);
    }
  };


  return (
    <div className="input-container">
      <textarea
        id="chat-input"
        placeholder="Type your message..."
        onKeyDown={handleKeyPress}
        onChange={handleInputChange}
      />
      <div className="button-container">
        <div className="left-buttons">
          <button
            className={`pause-button ${isSpeaking ? (isPaused ? 'paused' : 'speaking') : ''}`}
            onClick={togglePause}
            disabled={!lastSpokenTextRef.current && !isSpeaking}
            title={isSpeaking ? (isPaused ? 'Resume speech' : 'Pause speech') : 'Replay last speech'}
          >
            {isSpeaking ? (isPaused ? '▶' : '⏸') : '🔁'}
          </button>
        </div>
        <div className="right-buttons">
          <button className="submit-button no-select" onClick={handleSubmit}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInputArea