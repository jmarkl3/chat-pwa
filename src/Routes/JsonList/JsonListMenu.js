import React from 'react';
import { useNavigate } from 'react-router-dom';
import SlidePanel from '../App/SlidePanel';
import './JsonListMenu.css';

function JsonListMenu({ isOpen, setIsOpen, setShowSettings, setShowNotes }) {
  const navigate = useNavigate();

  return (
    <>

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
          </div>
        </div>
      </div>
    </>
  
  );
}

export default JsonListMenu;
