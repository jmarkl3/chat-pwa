import React, { useState } from 'react';
import SlidePanel from './SlidePanel';
import './Settings.css';

const STORAGE_KEY = 'chat-app-settings';

function Settings({ 
  ttsEnabled, 
  setTtsEnabled, 
  voices, 
  selectedVoice, 
  setSelectedVoice, 
  autoSendEnabled, 
  setAutoSendEnabled, 
  showSettings, 
  setShowSettings,
  setShowPromptPreface
}) {
  const [testText, setTestText] = useState("This is a test of the voice");

  const handleTtsChange = (e) => {
    const newValue = e.target.checked;
    setTtsEnabled(newValue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ttsEnabled: newValue,
      selectedVoice: selectedVoice,
      autoSendEnabled: autoSendEnabled 
    }));
    console.log('Saving TTS enabled:', newValue);
  };

  const handleVoiceChange = (e) => {
    const newVoice = e.target.value;
    setSelectedVoice(newVoice);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ttsEnabled: ttsEnabled,
      selectedVoice: newVoice,
      autoSendEnabled: autoSendEnabled 
    }));
  };

  const handleAutoSendChange = (e) => {
    const newValue = e.target.checked;
    setAutoSendEnabled(newValue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ttsEnabled: ttsEnabled, 
      selectedVoice: selectedVoice,
      autoSendEnabled: newValue 
    }));
  };

  const testVoice = () => {
    if (ttsEnabled && selectedVoice) {
      const utterance = new SpeechSynthesisUtterance(testText);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert('Please enable TTS and select a voice first');
    }
  };

  return (
    <SlidePanel title="Settings" isOpen={showSettings} setIsOpen={setShowSettings}>
      <div className="settings-content">
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={handleTtsChange}
            />
            Enable Text-to-Speech
          </label>
        </div>
        {ttsEnabled && (
          <div className="setting-item">
            <label>
              Voice:
              <select
                value={selectedVoice}
                onChange={handleVoiceChange}
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={autoSendEnabled}
              onChange={handleAutoSendChange}
            />
            Auto-send after 5 seconds of inactivity
          </label>
        </div>
        <div className="setting-item">
          <button 
            className="settings-action-button"
            onClick={() => setShowPromptPreface(true)}
          >
            Edit Prompt Preface
          </button>
        </div>
        <div className="setting-item">
          <label>Test Voice:</label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="test-voice-input"
            rows="2"
          />
          <button 
            onClick={testVoice}
            className="test-voice-button"
            disabled={!ttsEnabled}
          >
            Test Voice
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}

export default Settings;
