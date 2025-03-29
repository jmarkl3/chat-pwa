import React, { useState, useEffect } from 'react'

// The open and set open is for when its in a window
function ListsSelector({ isOpen, setIsOpen = ()=>{}, onSelectList=() => {}, createNewList=()=>{} }) {
    const [lists, setLists] = useState([]);

    useEffect(() => {
      // Load lists from localStorage
      const listsStr = localStorage.getItem('note-lists') || '[]';
      const loadedLists = JSON.parse(listsStr);
      // Sort by last modified
      loadedLists.sort((a, b) => b.lastModified - a.lastModified);
      setLists(loadedLists);
    }, [isOpen]); // Reload when window opens
  
    const handleSelectList = (list) => {
      onSelectList(list.id);
      setIsOpen(false); // Close the window after selection
    };

  return (
    <div className="lists-window">
        <button onClick={createNewList}>Create New List</button>
        <h2>Your Lists</h2>
        <div className="lists-container">
          {lists.map(list => (
            <div 
              key={list.id} 
              className="list-item"
              onClick={() => handleSelectList(list)}
            >
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
  )
}

export default ListsSelector