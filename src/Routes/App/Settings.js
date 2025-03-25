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
  setShowPromptPreface,
  previousMessagesCount,
  setPreviousMessagesCount,
  setShowLongTermMemory,
  saveHistoryEnabled,
  setSaveHistoryEnabled
}) {
  const [testText, setTestText] = useState("This is a test of the voice");
  const [generalOpen, setGeneralOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);

  const handleTtsChange = (e) => {
    const newValue = e.target.checked;
    setTtsEnabled(newValue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ttsEnabled: newValue,
      selectedVoice: selectedVoice,
      autoSendEnabled: autoSendEnabled,
      previousMessagesCount: previousMessagesCount,
      saveHistoryEnabled: saveHistoryEnabled
    }));
    console.log('Saving TTS enabled:', newValue);
  };

  const handleVoiceChange = (e) => {
    const newVoice = e.target.value;
    setSelectedVoice(newVoice);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ttsEnabled: ttsEnabled,
      selectedVoice: newVoice,
      autoSendEnabled: autoSendEnabled,
      previousMessagesCount: previousMessagesCount,
      saveHistoryEnabled: saveHistoryEnabled
    }));
  };

  const handleAutoSendChange = (e) => {
    const newValue = e.target.checked;
    setAutoSendEnabled(newValue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ttsEnabled: ttsEnabled, 
      selectedVoice: selectedVoice,
      autoSendEnabled: newValue,
      previousMessagesCount: previousMessagesCount,
      saveHistoryEnabled: saveHistoryEnabled
    }));
  };

  const handleSaveHistoryChange = (e) => {
    const newValue = e.target.checked;
    setSaveHistoryEnabled(newValue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ttsEnabled: ttsEnabled, 
      selectedVoice: selectedVoice,
      autoSendEnabled: autoSendEnabled,
      previousMessagesCount: previousMessagesCount,
      saveHistoryEnabled: newValue
    }));
  };

  const handlePreviousMessagesCountChange = (e) => {
    const newValue = parseInt(e.target.value) || 10;
    setPreviousMessagesCount(newValue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ttsEnabled: ttsEnabled, 
      selectedVoice: selectedVoice,
      autoSendEnabled: autoSendEnabled,
      previousMessagesCount: newValue,
      saveHistoryEnabled: saveHistoryEnabled
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

  const toggleSection = (section) => {
    switch (section) {
      case 'general':
        setGeneralOpen(!generalOpen);
        break;
      case 'voice':
        setVoiceOpen(!voiceOpen);
        break;
      case 'memory':
        setMemoryOpen(!memoryOpen);
        break;
      default:
        break;
    }
  };

  return (
    <SlidePanel title="Settings" isOpen={showSettings} setIsOpen={setShowSettings}>
      <div className="settings-content">
        <div className="settings-section">
          <button 
            className="section-header" 
            onClick={() => toggleSection('general')}
          >
            <span>General Settings</span>
            <span className="arrow">{generalOpen ? '▼' : '▶'}</span>
          </button>
          {generalOpen && (
            <div className="section-content">
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={autoSendEnabled}
                    onChange={(e) => setAutoSendEnabled(e.target.checked)}
                  />
                  Auto-send when voice input ends
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={saveHistoryEnabled}
                    onChange={handleSaveHistoryChange}
                  />
                  Save chat history
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="settings-section">
          <button 
            className="section-header" 
            onClick={() => toggleSection('voice')}
          >
            <span>Voice Settings</span>
            <span className="arrow">{voiceOpen ? '▼' : '▶'}</span>
          </button>
          {voiceOpen && (
            <div className="section-content">
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
          )}
        </div>

        <div className="settings-section">
          <button 
            className="section-header" 
            onClick={() => toggleSection('memory')}
          >
            <span>Memory Settings</span>
            <span className="arrow">{memoryOpen ? '▼' : '▶'}</span>
          </button>
          {memoryOpen && (
            <div className="section-content">
              <div className="setting-item">
                <label>
                  <span>Number of previous messages to include (increases token usage)</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={previousMessagesCount}
                    onChange={handlePreviousMessagesCountChange}
                  />
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
                <button 
                  className="settings-action-button"
                  onClick={() => setShowLongTermMemory(true)}
                >
                  Edit Long Term Memory
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SlidePanel>
  );
}

export default Settings;
