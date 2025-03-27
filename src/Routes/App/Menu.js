import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Menu.css';
import ChatHistory from './ChatHistory';

function Menu({ 
  isOpen, 
  setIsOpen, 
  setShowSettings, 
  setShowLongTermMemory, 
  setShowNote,
  menuChats,
  menuCurrentChatId,
  menuOnSelectChat,
  menuOnNewChat,
  menuOnUpdateChat,
  menuOnDeleteChat,
  menuOnImportChat
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

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

  const handleSettingsClick = () => {
    setIsOpen(false);
    setShowSettings(true);
  };

  const handleHistoryClick = () => {
    setIsOpen(false);
    setShowHistory(true);
  };

  const handleLongTermMemoryClick = () => {
    setIsOpen(false);
    setShowLongTermMemory(true);
  };

  const handleNoteClick = () => {
    setIsOpen(false);
    setShowNote(true);
  };

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

  return (
    <>
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
