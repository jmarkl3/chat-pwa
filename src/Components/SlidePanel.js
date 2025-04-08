import React from 'react';
import './SlidePanel.css';

function SlidePanel({ title, isOpen, setIsOpen, children, styles }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="slide-panel-overlay" onClick={() => setIsOpen(false)} />
      <div className="slide-panel-container" style={styles}>
        <div className="slide-panel-content">
          <div className="slide-panel-header">
            <h3>{title}</h3>
            <button className="close-button" onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="slide-panel-body">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export default SlidePanel;
