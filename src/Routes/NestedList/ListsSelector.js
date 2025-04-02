import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { setListID } from '../../store/idsSlice';
import { setComponentDisplay, setMenuOpen } from '../../store/menuSlice';
import ConfirmationBox from '../App/ConfirmationBox';
import './ListsSelector.css';

function ListsSelector({ isOpen, setIsOpen = ()=>{} }) {
    const dispatch = useDispatch();
    const { listID } = useSelector(state => state.main);
    const [lists, setLists] = useState([]);
    const [listToDelete, setListToDelete] = useState(null);
    const [listToDuplicate, setListToDuplicate] = useState(null);
    const [menuOpenListId, setMenuOpenListId] = useState(null);
    const [titleEditList, setTitleEditList] = useState(null);

    useEffect(() => {
      // Load lists from localStorage
      const listsStr = localStorage.getItem('note-lists') || '[]';
      console.log("listsStr: ", listsStr)
      let loadedLists = JSON.parse(listsStr);
      // Sort by timestamp
      loadedLists = loadedLists.sort((a, b) => b.timestamp - a.timestamp);
      console.log("listsStr sorted: ", listsStr)
      setLists(loadedLists);
    }, [isOpen]); // Reload when window opens
  
    const handleSelectList = (list) => {
      dispatch(setListID(list.id));
      dispatch(setComponentDisplay("list"));
      dispatch(setMenuOpen(false));
      setIsOpen(false);
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
          ? { ...l, content: newTitle, timestamp: Date.now() }
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

    const handleDuplicateClick = (e, list) => {
      e.stopPropagation();
      setListToDuplicate(list);
      setMenuOpenListId(null);
    };

    const handleConfirmDuplicate = () => {
      if (!listToDuplicate) return;

      // Generate new ID
      const newId = Math.random().toString(36).substr(2, 9);

      // Deep copy the list data
      const listDataStr = localStorage.getItem(`note-list-${listToDuplicate.id}`);
      if (listDataStr) {
        const listData = JSON.parse(listDataStr);
        const newListData = JSON.parse(JSON.stringify(listData)); // Deep copy
        newListData.id = newId;
        newListData.content = `${listData.content} (copy)`;
        localStorage.setItem(`note-list-${newId}`, JSON.stringify(newListData));

        // Update lists metadata
        const listsStr = localStorage.getItem('note-lists') || '[]';
        const currentLists = JSON.parse(listsStr);
        const timestamp = Date.now();

        const newList = {
          id: newId,
          content: newListData.content,
          timestamp: timestamp
        };

        currentLists.push(newList);
        currentLists.sort((a, b) => b.timestamp - a.timestamp);
        localStorage.setItem('note-lists', JSON.stringify(currentLists));

        // Update UI
        setLists(currentLists);
      }

      setListToDuplicate(null);
    };

    const handleCancelDuplicate = () => {
      setListToDuplicate(null);
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
        dispatch(setListID(null));
      }
    };

    const handleCancelDelete = () => {
      setListToDelete(null);
    };

    const handleCreateNewList = () => {
      const newList = {
        id: Date.now().toString(),
        content: "New List",
        timestamp: Date.now()
      };
      
      // Save new list
      localStorage.setItem(`note-list-${newList.id}`, JSON.stringify({
        id: newList.id,
        content: newList.content,
        isOpen: true,
        nested: []
      }));
      
      // Get current lists from localStorage and update
      const listsStr = localStorage.getItem('note-lists') || '[]';
      const currentLists = JSON.parse(listsStr);
      const updatedLists = [newList, ...currentLists];
      localStorage.setItem('note-lists', JSON.stringify(updatedLists));
      setLists(updatedLists);
      
      // Select the new list
      dispatch(setListID(newList.id));
      dispatch(setComponentDisplay("list"));
      dispatch(setMenuOpen(false));
      setIsOpen(false);
    };

  return (
    <div className="lists-selector">
        <div className="lists-header">
          <h3>Lists</h3>
          <button className="new-list-button" onClick={handleCreateNewList}>
            New List
          </button>
        </div>
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
                      {new Date(list.timestamp).toLocaleDateString()}
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
                        <button onClick={(e) => handleDuplicateClick(e, list)}>
                          Duplicate
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
            message={`Delete list ${listToDelete.content}?`}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        )}
        {listToDuplicate && (
          <ConfirmationBox
            message={`Duplicate list ${listToDuplicate.content}?`}
            onConfirm={handleConfirmDuplicate}
            onCancel={handleCancelDuplicate}
          />
        )}
      </div>
  )
}

export default ListsSelector