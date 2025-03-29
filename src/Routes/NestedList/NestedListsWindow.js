import React, { useState, useEffect } from 'react';
import SlidePanel from '../App/SlidePanel';
import './NestedListMenu.css';

function NestedListsWindow({isOpen, setIsOpen}) {
  const [lists, setLists] = useState([]);

  useEffect(() => {
    // Load lists from localStorage
    const listsStr = localStorage.getItem('note-lists') || '[]';
    const loadedLists = JSON.parse(listsStr);
    // Sort by last modified
    loadedLists.sort((a, b) => b.lastModified - a.lastModified);
    setLists(loadedLists);
  }, [isOpen]); // Reload when window opens

  return (    
    <SlidePanel isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="lists-window">
        <h2>Your Lists</h2>
        <div className="lists-container">
          {lists.map(list => (
            <div key={list.id} className="list-item">
              <div className="list-content">
                <span className="list-title">{list.content}</span>
                <span className="last-modified">
                  {new Date(list.lastModified).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {lists.length === 0 && (
            <div className="empty-message">No lists yet. Create your first list!</div>
          )}
        </div>
      </div>
    </SlidePanel>
  );
}

export default NestedListsWindow;