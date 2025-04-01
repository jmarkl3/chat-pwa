import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './Menu.css';
import ChatHistory from './ChatHistory';
import { PROMPT_PREFACE, STORAGE_KEY, NOTE_STORAGE_KEY, LONG_TERM_MEMORY_KEY } from './Data';
import TextInput from './TextInput';
import Settings from './Settings';
import { setMenuOpen, setComponentDisplay } from '../../store/menuSlice';
import NestedListsWindow from '../NestedList/NestedListsWindow';

function Menu({ scrollToBottom }) {
  const dispatch = useDispatch();
  const { isMenuOpen, componentDisplay } = useSelector(state => state.menu);

  // Installation prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  // Display menus
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPromptPreface, setShowPromptPreface] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLongTermMemory, setShowLongTermMemory] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showLists, setShowLists] = useState(false);

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
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  // Handle settings click
  const handleSettingsClick = () => {
    dispatch(setMenuOpen(false));
    setShowSettingsMenu(true);
  };

  // Handle history click
  const handleHistoryClick = () => {
    dispatch(setMenuOpen(false));
    setShowHistory(true);
  };

  // Handle lists click
  const handleListsClick = () => {
    dispatch(setMenuOpen(false));
    setShowLists(true);
  };

  // Handle long term memory click
  const handleLongTermMemoryClick = () => {
    dispatch(setMenuOpen(false));
    setShowLongTermMemory(true);
  };

  // Handle note click
  const handleNoteClick = () => {
    dispatch(setMenuOpen(false));
    setShowNote(true);
  };

  // Handle view toggle
  const handleViewToggle = () => {
    dispatch(setMenuOpen(false));
    dispatch(setComponentDisplay(componentDisplay === "chat" ? "list" : "chat"));
    if (componentDisplay === "list") {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  };

  return (
    <>
      {/* Menu button at top right */}
      <button className="hamburger-button no-select" onClick={() => dispatch(setMenuOpen(true))}>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Note */}
      <TextInput
        title="Note"
        isOpen={showNote}
        setIsOpen={(isOpen) => setShowNote(isOpen)}
        defaultValue={localStorage.getItem(NOTE_STORAGE_KEY)}
        onChange={(value) => {
          localStorage.setItem(NOTE_STORAGE_KEY, value);
        }}
      />

      {/* Long term memory */}
      <TextInput
        title="Memory"
        isOpen={showLongTermMemory}
        setIsOpen={(isOpen) => setShowLongTermMemory(isOpen)}
        defaultValue={localStorage.getItem(LONG_TERM_MEMORY_KEY)}
        onChange={(value) => {
          localStorage.setItem(LONG_TERM_MEMORY_KEY, value);
        }}
      />

      {/* Settings */}
      <Settings
        isOpen={showSettingsMenu}
        setIsOpen={setShowSettingsMenu}
        setShowPromptPreface={()=>{setShowPromptPreface(true); dispatch(setMenuOpen(false));}}
        setShowLongTermMemory={()=>{setShowLongTermMemory(true); dispatch(setMenuOpen(false));}}
        setShowNote={()=>{setShowNote(true); dispatch(setMenuOpen(false));}}
      />

      {isMenuOpen && (
        <div className="menu-overlay" onClick={() => dispatch(setMenuOpen(false))} />
      )}
      <div className={`menu-container no-select ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-content">
          <h3>Menu</h3>
          <div className="menu-items">
            <button className="menu-item" onClick={handleHistoryClick}>Chats History</button>
            <button className="menu-item" onClick={handleListsClick}>Lists</button>
            <button className="menu-item" onClick={handleViewToggle}>
              Switch to {componentDisplay === "chat" ? "List" : "Chat"} View
            </button>
            <button className="menu-item" onClick={handleNoteClick}>Note</button>
            <button className="menu-item" onClick={handleLongTermMemoryClick}>Memory</button>
            <button className="menu-item" onClick={handleSettingsClick}>Settings</button>
            <button className="menu-item" onClick={handleInstallClick}>Install App</button>
            <button className="menu-item" onClick={() => dispatch(setMenuOpen(false))}>Close</button>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <ChatHistory
        isOpen={showHistory}
        setIsOpen={setShowHistory}
        scrollToBottom={scrollToBottom}
      />

      {/* Lists Window */}
      <NestedListsWindow
        isOpen={showLists}
        setIsOpen={setShowLists}
      />
    </>
  );
}

export default Menu;
