import React, { useState, useRef, useEffect } from 'react';
import './Message.css';

const Message = ({ 
  message, 
  type, 
  selectedVoice, 
  voices, 
  onSpeakFromHere, 
  onAddToShortTermMemory 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && 
          menuRef.current && 
          !menuRef.current.contains(event.target) &&
          !buttonRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleSpeakMessage = () => {
    if (selectedVoice) {
      const utterance = new SpeechSynthesisUtterance(message);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
      }
    }
    setShowMenu(false);
  };

  const handleSpeakFromHere = () => {
    onSpeakFromHere();
    setShowMenu(false);
  };

  const handleAddToMemory = () => {
    onAddToShortTermMemory(message);
    setShowMenu(false);
  };

  return (
    <div className={`message ${type}`}>
      <div className="message-content">
        {message}
        <button 
          ref={buttonRef}
          className="menu-dots"
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Message options"
        >
          ⋮
        </button>
        {showMenu && (
          <div ref={menuRef} className="message-menu">
            <button onClick={handleSpeakMessage}>Read message</button>
            <button onClick={handleSpeakFromHere}>Speak from here</button>
            <button onClick={handleAddToMemory}>Add to short term memory</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
