import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NestedListsWindow from './NestedListsWindow';

function NestedListMenu({ createNewList, onSelectList }) {
 
    const navigate = useNavigate();
    const [showListsWindow, setShowListsWindow] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleShowLists = () => {
        setShowListsWindow(true);
        setIsOpen(false);
    };

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
                    <button className="menu-item" onClick={() => navigate('/app')}>Chat</button>
                    <button className="menu-item" onClick={() => setIsOpen(false)}>Close</button>
                </div>
                </div>
            </div>
            
            <NestedListsWindow
                isOpen={showListsWindow}
                setIsOpen={setShowListsWindow}
                onSelectList={onSelectList}
                createNewList={createNewList}
            >

            </NestedListsWindow>

        </>
    );
}

export default NestedListMenu;
