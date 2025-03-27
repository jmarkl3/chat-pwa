import React, { useState, useEffect } from 'react';
import './JsonListSettings.css';

function JsonListSettings({ isOpen, setIsOpen }) {
  const [enterToInsert, setEnterToInsert] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const settings = JSON.parse(localStorage.getItem('jsonListSettings') || '{}');
    setEnterToInsert(settings.enterToInsert || false);
  }, []);

  const handleEnterToInsertChange = (e) => {
    const newValue = e.target.checked;
    setEnterToInsert(newValue);
    
    // Save to localStorage
    const settings = JSON.parse(localStorage.getItem('jsonListSettings') || '{}');
    settings.enterToInsert = newValue;
    localStorage.setItem('jsonListSettings', JSON.stringify(settings));
  };

  return (
    <>
      {isOpen && (
        <div className="settings-overlay" onClick={() => setIsOpen(false)} />
      )}
      <div className={`settings-container ${isOpen ? 'open' : ''}`}>
        <div className="settings-content">
          <div className="settings-header">
            <h3>Settings</h3>
            <button className="close-button" onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="settings-items">
            <label className="setting-item">
              <span className="setting-label">Enter to insert after current item</span>
              <input
                type="checkbox"
                checked={enterToInsert}
                onChange={handleEnterToInsertChange}
              />
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

export default JsonListSettings;
