import React from 'react';
import './Menu.css';

function Menu({ isOpen, setIsOpen, setShowSettings, setShowLongTermMemory }) {
  const handleSettingsClick = () => {
    setIsOpen(false);
    setShowSettings(true);
  };

  const handleLongTermMemoryClick = () => {
    setIsOpen(false);
    setShowLongTermMemory(true);
  };

  return (
    <>
      {isOpen && (
        <div className="menu-overlay" onClick={() => setIsOpen(false)} />
      )}
      <div className={`menu-container ${isOpen ? 'open' : ''}`}>
        <div className="menu-content">
          <h3>Menu</h3>
          <div className="menu-items">
            <button className="menu-item" onClick={handleSettingsClick}>Settings</button>
            <button className="menu-item">History</button>
            <button className="menu-item" onClick={handleLongTermMemoryClick}>Long Term Memory</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Menu;
