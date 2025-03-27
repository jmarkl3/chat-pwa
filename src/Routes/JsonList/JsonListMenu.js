import React from 'react';
import { useNavigate } from 'react-router-dom';
import SlidePanel from '../App/SlidePanel';
import './JsonListMenu.css';

function JsonListMenu({ isOpen, setIsOpen, setShowSettings, setShowNotes }) {
  const navigate = useNavigate();

  return (
    <SlidePanel title="Menu" isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="menu-items">
        <button onClick={() => {
          setShowNotes(true);
          setIsOpen(false);
        }}>Lists</button>
        <button onClick={() => {
          setShowSettings(true);
          setIsOpen(false);
        }}>Settings</button>
        <button onClick={() => navigate('/app')}>Chat</button>
      </div>
    </SlidePanel>
  );
}

export default JsonListMenu;
