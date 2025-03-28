import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
function NestedListMenu({ 

}) {
 
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>

        {/* Menu button at top right */}
        <button className="hamburger-button" onClick={() => setIsOpen(true)}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
        </button>

        {isOpen && (
            <div className="menu-overlay" onClick={() => setIsOpen(false)} />
        )}
        <div className={`menu-container ${isOpen ? 'open' : ''}`}>
            <div className="menu-content">
            <h3>Menu</h3>
            <div className="menu-items">
                <button className="menu-item" onClick={() => Navigate('/app')}>Chat</button>
                <button className="menu-item" onClick={() => setIsOpen()}>Close</button>
            </div>
            </div>
        </div>
        </>
    );
}

export default NestedListMenu;
