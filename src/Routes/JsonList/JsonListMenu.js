import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './JsonListMenu.css';
import JsonListSettings from './JsonListSettings';

function JsonListMenu({ isOpen, setIsOpen, setShowNotes }) {
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* <JsonListSettings
        isOpen={showSettings}
        setIsOpen={setShowSettings}
      /> */}

      {/* Menu button at top right */}
      <button className="hamburger-button" onClick={() => setIsOpen(true)}>
      ☰
      </button>

      {isOpen && (
        <div className="menu-overlay" onClick={() => setIsOpen(false)} />
      )}

    <div className={`menu-container ${isOpen ? 'open' : ''}`}>
      <div className="menu-content">
        <h3>Menu</h3>
        <div className="menu-items">
          <button 
            className="menu-item"
            onClick={() => {
              setShowNotes(true);
              setIsOpen(false);
            }}>
              Lists
          </button>

          <button 
            className="menu-item"
            onClick={() => {
              setShowSettings(true);
              setIsOpen(false);
            }}>
              Settings
            </button>
          <button 
            className="menu-item"
            onClick={() => navigate('/app')}>
              Chat
            </button>
          <button className="menu-item" onClick={() => setIsOpen()}>Close</button>
          </div>
        </div>
      </div>
    </>
  
  );
}

export default JsonListMenu;
