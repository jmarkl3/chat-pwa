import React, { useState, useEffect } from 'react'
import ConfirmationBox from '../App/ConfirmationBox';
import './ListsSelector.css';

// The open and set open is for when its in a window
function ListsSelector({ isOpen, setIsOpen = ()=>{}, onSelectList=() => {}, createNewList=()=>{} }) {
    const [lists, setLists] = useState([]);
    const [listToDelete, setListToDelete] = useState(null);
    const [menuOpenListId, setMenuOpenListId] = useState(null);
    const [titleEditList, setTitleEditList] = useState(null);

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

    const handleMenuClick = (e, listId) => {
      e.stopPropagation();
      setMenuOpenListId(listId === menuOpenListId ? null : listId);
    };

    const startEditing = (e, list) => {
      e.stopPropagation();
      console.log('Starting edit for list:', {
        id: list.id,
        currentContent: list.content
      });
      setTitleEditList(list);
      setMenuOpenListId(null);
    };

    const handleTitleChange = (e) => {
      const newTitle = e.target.value;
      if (!titleEditList) return;

      console.log('Updating title:', {
        listId: titleEditList.id,
        oldTitle: titleEditList.content,
        newTitle: newTitle
      });

      // Update list metadata
      const listsStr = localStorage.getItem('note-lists') || '[]';
      const currentLists = JSON.parse(listsStr);
      console.log('Current lists before update:', currentLists);
      
      const updatedLists = currentLists.map(l => 
        l.id === titleEditList.id 
          ? { ...l, content: newTitle, lastModified: Date.now() }
          : l
      );
      console.log('Lists after update:', updatedLists);
      localStorage.setItem('note-lists', JSON.stringify(updatedLists));
      
      // Update list data (content in root node)
      const listDataStr = localStorage.getItem(`note-list-${titleEditList.id}`);
      if (listDataStr) {
        const listData = JSON.parse(listDataStr);
        console.log('List data before update:', listData);
        listData.content = newTitle;
        localStorage.setItem(`note-list-${titleEditList.id}`, JSON.stringify(listData));
        console.log('List data after update:', listData);
      } else {
        console.warn('No list data found for id:', titleEditList.id);
      }

      // Update the titleEditList state to reflect new content
      setTitleEditList({
        ...titleEditList,
        content: newTitle
      });
      
      setLists(updatedLists);
    };

    const handleExitTitleEdit = (e) => {
      e.preventDefault();
      console.log('Exiting title edit mode');
      setTitleEditList(null);
    };

    const handleDeleteClick = (e, list) => {
      e.stopPropagation();
      setListToDelete(list);
      setMenuOpenListId(null);
    };

    const handleConfirmDelete = () => {
      if (!listToDelete) return;

      // Remove from lists data
      const listsStr = localStorage.getItem('note-lists') || '[]';
      const currentLists = JSON.parse(listsStr);
      const updatedLists = currentLists.filter(l => l.id !== listToDelete.id);
      localStorage.setItem('note-lists', JSON.stringify(updatedLists));

      // Remove list data
      localStorage.removeItem(`note-list-${listToDelete.id}`);

      // Update UI
      setLists(updatedLists);
      setListToDelete(null);

      // If the deleted list was selected, clear the selection
      const currentListId = localStorage.getItem('selected-list-id');
      if (currentListId === listToDelete.id) {
        localStorage.setItem('selected-list-id', '');
        onSelectList(null);
      }
    };

    const handleCancelDelete = () => {
      setListToDelete(null);
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
              onClick={() => {
                if (!titleEditList) {
                  handleSelectList(list);
                }
              }}
            >
              <div className="list-content">
                {titleEditList?.id === list.id ? (
                  <form onSubmit={handleExitTitleEdit} className="list-edit-form">
                    <input
                      type="text"
                      defaultValue={titleEditList.content}
                      onChange={handleTitleChange}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <button 
                      type="submit"
                      className="confirm-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExitTitleEdit(e);
                      }}
                    >
                      ✓
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="list-title">{list.content}</span>
                    <span className="last-modified">
                      {new Date(list.lastModified).toLocaleDateString()}
                    </span>
                    <button 
                      className="chat-menu-button" 
                      onClick={(e) => handleMenuClick(e, list.id)}
                    >
                      ⋮
                    </button>
                    {menuOpenListId === list.id && (
                      <div className="chat-menu">
                        <button onClick={(e) => startEditing(e, list)}>
                          Rename
                        </button>
                        <button onClick={(e) => handleDeleteClick(e, list)}>
                          Delete
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenListId(null);
                        }}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {lists.length === 0 && (
            <div className="empty-message">No lists yet. Create your first list!</div>
          )}
        </div>
        {listToDelete && (
          <ConfirmationBox
            message={`delete list ${listToDelete.content}?`}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        )}
      </div>
  )
}

export default ListsSelector