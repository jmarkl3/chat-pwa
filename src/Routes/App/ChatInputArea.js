import React, { useRef } from 'react'
import { useSelector } from 'react-redux';

function ChatInputArea({
  inputRef,
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
      handleSubmit();
    }
  };

  const handleInputChange = () => {
    if (!settings.autoSendEnabled || !inputRef.current) return;

    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
    }

    const text = inputRef.current.value.trim();
    if (text) {
      autoSendTimerRef.current = setTimeout(() => {
        handleSubmit();
      }, settings.autoSendTimeout || 3000);
    }
  };

  return (
    <div className="input-container">
      <textarea
        ref={inputRef}
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
            {isSpeaking ? (isPaused ? '▶️' : '⏸️') : '▶️'}
          </button>
        </div>
        <button className="submit-button no-select" onClick={handleSubmit}>
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatInputArea