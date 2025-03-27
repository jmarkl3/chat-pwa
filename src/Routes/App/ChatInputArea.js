import React, { useRef } from 'react'

function ChatInputArea({
  inputRef,
  lastSpokenTextRef,
  isSpeaking,
  isPaused,
  togglePause,
  handleSubmit, 
  settingsObject,
}) {
  const autoSendTimerRef = useRef(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = () => {
    // Only set timer if auto-send is enabled and there's text
    if (settingsObject.autoSendEnabled && inputRef.current.value.trim()) {
      // Clear any existing timer
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }
      
      // Set new timer using the timeout from settings
      autoSendTimerRef.current = setTimeout(() => {
        if (inputRef.current.value.trim()) {
          handleSubmit();
        }
      }, settingsObject.autoSendTimeout * 1000);
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
        <button className="submit-button" onClick={handleSubmit}>
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatInputArea