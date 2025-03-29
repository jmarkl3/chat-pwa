import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Menu.css';
import ChatHistory from './ChatHistory';
import { PROMPT_PREFACE, STORAGE_KEY, NOTE_STORAGE_KEY, LONG_TERM_MEMORY_KEY } from './Data';
import TextInput from './TextInput';
import Settings from './Settings';

function Menu({ 
  isOpen, 
  setIsOpen, 
  menuChats,
  menuCurrentChatId,
  menuOnSelectChat,
  menuOnNewChat,
  menuOnUpdateChat,
  menuOnDeleteChat,
  menuOnImportChat, 
  settingsObject, 
  setSettingsObject,
  setLongTermMemory,
  longTermMemory,
  voices
}) {
  // Installation prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  // Display menus
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPromptPreface, setShowPromptPreface] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLongTermMemory, setShowLongTermMemory] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');

  useEffect(()=>{
    loadSavedNote()
  },[showNote])
  useEffect(()=>{
    loadSavedMemory()
  },[showLongTermMemory])
  // Functions to load data from localStorage
  const loadSavedMemory = () => {
    const savedMemory = localStorage.getItem(LONG_TERM_MEMORY_KEY);
    if (savedMemory) {
      setLongTermMemory(savedMemory);
    }
  };

  const loadSavedNote = () => {
    const savedNote = localStorage.getItem(NOTE_STORAGE_KEY);
    if (savedNote) {
      setNote(savedNote);
    }
  };

  // Load long term memory and note from localStorage
  useEffect(() => {
    loadSavedMemory();
    loadSavedNote();
  }, [setLongTermMemory, setNote]);



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

  // console.log("settingsObject", settingsObject)
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
        defaultValue={settingsObject.promptPreface || PROMPT_PREFACE}
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
        styles={{ zIndex: 1001 }}
      />

      {/* Note */}
      <TextInput
        title="Note"
        isOpen={showNote}
        setIsOpen={setShowNote}
        defaultValue={note}
        onChange={(value) => {
          setNote(value);
          localStorage.setItem(NOTE_STORAGE_KEY, value);
        }}
        refreshFunction={loadSavedNote}
      />
      {/* Long Term Memory */}
      <TextInput
        title="Long Term Memory"
        isOpen={showLongTermMemory}
        setIsOpen={setShowLongTermMemory}
        defaultValue={longTermMemory}
        onChange={(value) => {
          setLongTermMemory(value);
          localStorage.setItem(LONG_TERM_MEMORY_KEY, value);
        }}
        refreshFunction={loadSavedMemory}
      />

      {/* Settings */}
      <Settings
        settingsObject={settingsObject}
        setSettingsObject={setSettingsObject}
        voices={voices || []}
        isOpen={showSettingsMenu}
        setIsOpen={setShowSettingsMenu}
        setShowPromptPreface={()=>{setShowPromptPreface(true); setIsOpen(false);}}
        setShowLongTermMemory={()=>{setShowLongTermMemory(true); setIsOpen(false);}}
        setShowNote={()=>{setShowNote(true); setIsOpen(false);}}
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
            <button className="menu-item" onClick={() => navigate('/nested-list')}>Lists</button>
            <button className="menu-item" onClick={handleInstallClick}>Install App</button>
            <button className="menu-item" onClick={() => setIsOpen()}>Close</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Menu;
