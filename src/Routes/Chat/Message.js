import React, { useState } from 'react';
import './Message.css';
import TextInput from '../../Components/TextInput';
import DotMenu from '../../Components/DotMenu';

const Message = ({ 
  messageData, 
  selectedVoice, 
  onSpeakFromHere, 
  onAddToShortTermMemory 
}) => {
  const [showRawMessage, setShowRawMessage] = useState(false);

  const handleSpeakMessage = () => {
    if (selectedVoice) {
      const utterance = new SpeechSynthesisUtterance(messageData.content);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className={`message ${messageData.role}`}>
      <div className="message-content">
        {messageData.content}
        <DotMenu>
          <button onClick={handleSpeakMessage}>Read message</button>
          <button onClick={onSpeakFromHere}>Speak from here</button>
          <button onClick={() => onAddToShortTermMemory(messageData.content)}>Add to short term memory</button>
          <button onClick={() => setShowRawMessage(true)}>View raw message</button>
        </DotMenu>
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
