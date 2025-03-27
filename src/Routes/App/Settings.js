import React, { useState } from 'react';
import SlidePanel from './SlidePanel';
import './Settings.css';

const STORAGE_KEY = 'chat-app-settings';

function Settings({ 
  settingsObject,
  setSettingsObject,
  voices,
  isOpen,
  setIsOpen,
  setShowPromptPreface,
  setShowLongTermMemory,
  setShowNote
}) {
  const [testText, setTestText] = useState("This is a test of the voice");
  const [generalOpen, setGeneralOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);

  const updateSetting = (settingName, value) => {
    setSettingsObject(prevSettings => {
      const newSettings = { ...prevSettings, [settingName]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const handleTtsChange = (e) => {
    updateSetting('ttsEnabled', e.target.checked);
  };

  const handleVoiceChange = (e) => {
    updateSetting('selectedVoice', e.target.value);
  };

  const handleAutoSendChange = (e) => {
    updateSetting('autoSendEnabled', e.target.checked);
  };

  const handleAutoSendTimeoutChange = (e) => {
    const newValue = e.target.value === '' ? 5 : parseInt(e.target.value);
    updateSetting('autoSendTimeout', newValue);
  };

  const handlePreviousMessagesCountChange = (e) => {
    const newValue = e.target.value === '' ? 10 : parseInt(e.target.value);
    updateSetting('previousMessagesCount', newValue);
  };

  const handleSaveHistoryChange = (e) => {
    updateSetting('saveHistoryEnabled', e.target.checked);
  };

  const handleInactivityTimerChange = (e) => {
    updateSetting('inactivityTimerEnabled', e.target.checked);
  };

  const testVoice = () => {
    if (settingsObject.ttsEnabled && settingsObject.selectedVoice) {
      const utterance = new SpeechSynthesisUtterance(testText);
      const voice = voices.find(v => v.name === settingsObject.selectedVoice);
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
    <SlidePanel title="Settings" isOpen={isOpen} setIsOpen={setIsOpen}>
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
                    checked={settingsObject.autoSendEnabled}
                    onChange={handleAutoSendChange}
                  />
                  Auto-send when voice input ends
                </label>
                {settingsObject.autoSendEnabled && (
                  <div className="setting-item" style={{ marginLeft: '20px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Auto-send timeout:</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={settingsObject.autoSendTimeout}
                        onChange={handleAutoSendTimeoutChange}
                        className="auto-send-timeout"
                      />
                      <span style={{ marginLeft: '4px' }}>seconds</span>
                    </label>
                  </div>
                )}
              </div>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settingsObject.inactivityTimerEnabled}
                    onChange={handleInactivityTimerChange}
                  />
                  Enable inactivity timer
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settingsObject.saveHistoryEnabled}
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
                    checked={settingsObject.ttsEnabled}
                    onChange={handleTtsChange}
                  />
                  Enable text-to-speech
                </label>
              </div>
              {settingsObject.ttsEnabled && (
                <>
                  <div className="setting-item">
                    <label>
                      Voice:
                      <select 
                        value={settingsObject.selectedVoice} 
                        onChange={handleVoiceChange}
                        className="voice-select"
                      >
                        <option value="">Select a voice</option>
                        {voices.map(voice => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="setting-item">
                    <label>
                      Test text:
                      <input
                        type="text"
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        className="test-text-input"
                      />
                    </label>
                    <button onClick={testVoice} className="test-voice-button">
                      Test Voice
                    </button>
                  </div>
                </>
              )}
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
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <span>Previous messages to include:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settingsObject.previousMessagesCount}
                    onChange={handlePreviousMessagesCountChange}
                    className="previous-messages-count"
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
              <div className="setting-item">
                <button 
                  className="settings-action-button"
                  onClick={() => setShowNote(true)}
                >
                  Open Note
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
