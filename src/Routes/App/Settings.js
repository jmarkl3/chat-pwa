import React, { useState, useEffect } from 'react';
import './Settings.css';

const STORAGE_KEY = 'chat-app-settings';

function Settings({ 
  ttsEnabled, 
  setTtsEnabled, 
  voices, 
  selectedVoice, 
  setSelectedVoice, 
  showSettings 
}) {
  const [testText, setTestText] = useState("This is a test of the voice");

  const handleTtsChange = (e) => {
    const newValue = e.target.checked;
    setTtsEnabled(newValue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ttsEnabled: newValue,
      selectedVoice
    }));
    console.log('Saving TTS enabled:', newValue);
  };

  const handleVoiceChange = (e) => {
    const newVoice = e.target.value;
    setSelectedVoice(newVoice);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ttsEnabled,
      selectedVoice: newVoice
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

  if (!showSettings) return null;

  return (
    <div className="settings-menu">
      <h3>Settings</h3>
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
      <div className="setting-item">
        <label>
          Voice:
          <select
            value={selectedVoice}
            onChange={handleVoiceChange}
            disabled={!ttsEnabled}
          >
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name}
              </option>
            ))}
          </select>
        </label>
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
  );
}

export default Settings;
