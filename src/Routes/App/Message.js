import React, { useState, useRef, useEffect } from 'react';
import './Message.css';
import TextInput from './TextInput';

const Message = ({ 
  messageData, 
  selectedVoice, 
  voices, 
  onSpeakFromHere, 
  onAddToShortTermMemory 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showRawMessage, setShowRawMessage] = useState(false);
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
      const utterance = new SpeechSynthesisUtterance(messageData.content);
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
    onAddToShortTermMemory(messageData.content);
    setShowMenu(false);
  };

  const handleViewRaw = () => {
    setShowRawMessage(true);
    setShowMenu(false);
  };

  return (
    <div className={`message ${messageData.role}`}>
      <div className="message-content">
        {messageData.content}
        <button 
          ref={buttonRef}
          className="menu-dots no-select"
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
            <button onClick={handleViewRaw}>View raw message</button>
          </div>
        )}
      </div>
      <TextInput
        title="Raw Message Data"
        isOpen={showRawMessage}
        setIsOpen={setShowRawMessage}
        defaultValue={messageData}
        onChange={() => {}}
        showRestoreDefault={false}
        type="json"
      />
    </div>
  );
};

export default Message;
