import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import SlidePanel from './SlidePanel';
import './Settings.css';
import { updateSetting } from '../../store/menuSlice';

function Settings({ 
  isOpen,
  setIsOpen,
  setShowPromptPreface,
  setShowLongTermMemory,
  setShowNote
}) {
  const dispatch = useDispatch();
  const { settings } = useSelector(state => state.menu);
  const [voices, setVoices] = useState([]);
  const [testText, setTestText] = useState("This is a test of the voice");
  const [generalOpen, setGeneralOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleSettingChange = (settingName, value) => {
    dispatch(updateSetting({ name: settingName, value }));
  };

  const handleTtsChange = (e) => {
    handleSettingChange('ttsEnabled', e.target.checked);
  };

  const handleVoiceChange = (e) => {
    handleSettingChange('selectedVoice', e.target.value);
  };

  const handleAutoSendChange = (e) => {
    handleSettingChange('autoSendEnabled', e.target.checked);
  };

  const handleAutoSendTimeoutChange = (e) => {
    const newValue = e.target.value === '' ? 5 : parseInt(e.target.value);
    handleSettingChange('autoSendTimeout', newValue);
  };

  const handlePreviousMessagesCountChange = (e) => {
    const newValue = e.target.value === '' ? 10 : parseInt(e.target.value);
    handleSettingChange('previousMessagesCount', newValue);
  };

  const handleSaveHistoryChange = (e) => {
    handleSettingChange('saveHistoryEnabled', e.target.checked);
  };

  const handleInactivityTimerChange = (e) => {
    handleSettingChange('inactivityTimerEnabled', e.target.checked);
  };

  const handleFilterSpecialCharactersChange = (e) => {
    handleSettingChange('filterSpecialCharacters', e.target.checked);
  };

  const handleReplayAllMessagesChange = (e) => {
    handleSettingChange('replayAllMessages', e.target.checked);
  };

  const testVoice = () => {
    const utterance = new SpeechSynthesisUtterance(testText);
    const voice = voices.find(v => v.name === settings.selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
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
                    checked={settings.autoSendEnabled}
                    onChange={handleAutoSendChange}
                  />
                  Auto send messages
                </label>
                {settings.autoSendEnabled && (
                  <div className="setting-item" style={{ marginLeft: '20px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Auto-send timeout:</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={settings.autoSendTimeout}
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
                    checked={settings.inactivityTimerEnabled}
                    onChange={handleInactivityTimerChange}
                  />
                  Enable inactivity timer
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.replayAllMessages}
                    onChange={handleReplayAllMessagesChange}
                  />
                  Include User Messages in Replay
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.saveHistoryEnabled}
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
                    checked={settings.ttsEnabled}
                    onChange={handleTtsChange}
                  />
                  Enable text-to-speech
                </label>
              </div>
              {settings.ttsEnabled && (
                <>
                  <div className="setting-item">
                    <label>
                      Voice:
                      <select 
                        value={settings.selectedVoice} 
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
                      <input
                        type="checkbox"
                        checked={settings.filterSpecialCharacters}
                        onChange={handleFilterSpecialCharactersChange}
                      />
                      Filter special characters in speech
                    </label>
                    <div className="setting-description">
                      Remove special characters like *, -, and / when speaking text
                    </div>
                  </div>
                  <div className="setting-item">
                      <div>
                        Test text:
                      </div>
                      <textarea
                        style={{ width: 'calc(100% - 20px)', height: '40px', padding: '8px' }}
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        className="test-text-input"
                      />
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
                    value={settings.previousMessagesCount}
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
