import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Menu.css';
import ChatHistory from './ChatHistory';
import { PROMPT_PREFACE, STORAGE_KEY, NOTE_STORAGE_KEY } from './Data';
import TextInput from './TextInput';
import Settings from './Settings';

function Menu({ 
  isOpen, 
  setIsOpen, 
  setShowSettings, 
  setShowLongTermMemory, 
  menuChats,
  menuCurrentChatId,
  menuOnSelectChat,
  menuOnNewChat,
  menuOnUpdateChat,
  menuOnDeleteChat,
  menuOnImportChat, 
  settingsObject, 
  setSettingsObject,
}) {
  // Installation prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  // Display menus
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPromptPreface, setShowPromptPreface] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(() => {
    const savedNote = localStorage.getItem(NOTE_STORAGE_KEY);
    return savedNote || '';
  });
  const [localNote, setLocalNote] = useState(note);
  // Routing
  const navigate = useNavigate();

  // Installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
  };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle install click
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('No installation prompt available');
      return;
    }

    try {
      const result = await deferredPrompt.prompt();
      console.log('Install prompt result:', result);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }

    setDeferredPrompt(null);
  };


  // Handle settings click (just hides this menu and shows that one)
  const handleSettingsClick = () => {
    setIsOpen(false);
    setShowSettingsMenu(true);
  };

  // Handle history click (just hides this menu and shows that one)
  const handleHistoryClick = () => {
    setIsOpen(false);
    setShowHistory(true);
  };

  // Handle long term memory click (just hides this menu and shows that one)
  const handleLongTermMemoryClick = () => {
    setIsOpen(false);
    setShowLongTermMemory(true);
  };

  // Handle note click (just hides this menu and shows that one)
  const handleNoteClick = () => {
    setIsOpen(false);
    setShowNote(true);
  };

  return (
    <>

      {/* Menu button at top right */}
      <button className="hamburger-button" onClick={() => setIsOpen(true)}>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Chat History */}
      <ChatHistory
        isOpen={showHistory}
        setIsOpen={setShowHistory}
        chats={menuChats}
        currentChatId={menuCurrentChatId}
        onSelectChat={menuOnSelectChat}
        onNewChat={menuOnNewChat}
        onUpdateChat={menuOnUpdateChat}
        onDeleteChat={menuOnDeleteChat}
        onImportChat={menuOnImportChat}
      />

      {/* Prompt Preface */}
      <TextInput
        title="Prompt Preface"
        // Showing the menu or not 
        isOpen={showPromptPreface}
        setIsOpen={(isOpen) => setShowPromptPreface(isOpen)}
        // The surrent value
        defaultValue={settingsObject.promptPreface}
        // Update the value in localstorage
        onChange={(value) => {
          const settings = { ...settingsObject, promptPreface: value };
          localStorage.setItem(STORAGE_KEY  , JSON.stringify(settings));
          setSettingsObject(settings);
        }}
        showRestoreDefault={true}
        // Restore default value fromthe string in data.js
        onRestoreDefault={() => {
          const settings = { ...settingsObject, promptPreface: PROMPT_PREFACE };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
          setSettingsObject(settings)
        }}
      />

      {/* Note */}
      <TextInput
        title="Note"
        isOpen={showNote}
        setIsOpen={setShowNote}
        defaultValue={localNote}
        onChange={(value) => {
          setLocalNote(value);
        }}
        onBlur={() => {
          localStorage.setItem(NOTE_STORAGE_KEY, localNote);
          setNote(localNote);
        }}
      />

      {/* Settings */}
      <Settings
        isOpen={showSettingsMenu}
        setIsOpen={setShowSettingsMenu}
        settingsObject={settingsObject}
        setSettingsObject={setSettingsObject}
      />

      {isOpen && (
        <div className="menu-overlay" onClick={() => setIsOpen(false)} />
      )}
      <div className={`menu-container ${isOpen ? 'open' : ''}`}>
        <div className="menu-content">
          <h3>Menu</h3>
          <div className="menu-items">
            <button className="menu-item" onClick={handleSettingsClick}>Settings</button>
            <button className="menu-item" onClick={handleHistoryClick}>History</button>
            <button className="menu-item" onClick={handleLongTermMemoryClick}>Long Term Memory</button>
            <button className="menu-item" onClick={handleNoteClick}>Note</button>
            <button className="menu-item" onClick={() => navigate('/json-list')}>Lists</button>
            <button className="menu-item" onClick={handleInstallClick}>Install App</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Menu;
