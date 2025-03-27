import React, { useState, useEffect } from 'react';
import './JsonListNotes.css';
import SlidePanel from '../App/SlidePanel';
import ConfirmationBox from '../App/ConfirmationBox';

const LISTS_METADATA_KEY = 'jsonListsMetadata';
const LIST_DATA_PREFIX = 'jsonList_';

function JsonListNotes({ isOpen, setIsOpen, onLoadNote, setCurrentListId, onMetadataChange }) {
  const [lists, setLists] = useState(() => {
    return JSON.parse(localStorage.getItem(LISTS_METADATA_KEY) || '{}');
  });
  const [editingListId, setEditingListId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [menuOpenListId, setMenuOpenListId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);

  useEffect(() => {
    const metadata = JSON.parse(localStorage.getItem(LISTS_METADATA_KEY) || '{}');
    setLists(metadata);
  }, [isOpen]);

  const handleNewList = () => {
    const newList = {
      id: Date.now().toString(),
      title: 'New List',
      timestamp: Date.now()
    };

    // Save metadata
    const updatedLists = { ...lists, [newList.id]: newList };
    setLists(updatedLists);
    localStorage.setItem(LISTS_METADATA_KEY, JSON.stringify(updatedLists));
    if (onMetadataChange) onMetadataChange(updatedLists);

    // Save initial data
    const initialData = {
      0: {
        content: 'New Item',
        nested: {}
      }
    };
    localStorage.setItem(LIST_DATA_PREFIX + newList.id, JSON.stringify(initialData));
    
    // Set as current and load
    localStorage.setItem('currentJsonListId', newList.id);
    onLoadNote(initialData);
    setIsOpen(false);
  };

  const handleMenuClick = (e, listId) => {
    e.stopPropagation();
    setMenuOpenListId(listId === menuOpenListId ? null : listId);
  };

  const startEditing = (e, listId, currentTitle) => {
    e.stopPropagation();
    setEditingListId(listId);
    setEditingTitle(currentTitle);
    setMenuOpenListId(null);
  };

  const handleRename = (e, listId) => {
    e.preventDefault();
    if (editingTitle.trim()) {
      const updatedLists = {
        ...lists,
        [listId]: {
          ...lists[listId],
          title: editingTitle.trim(),
          timestamp: Date.now()
        }
      };
      setLists(updatedLists);
      localStorage.setItem(LISTS_METADATA_KEY, JSON.stringify(updatedLists));
      if (onMetadataChange) onMetadataChange(updatedLists);
      setEditingListId(null);
    }
  };

  const confirmDelete = (e, listId) => {
    e.stopPropagation();
    setListToDelete(listId);
    setShowConfirmation(true);
    setMenuOpenListId(null);
  };

  const handleDelete = () => {
    if (listToDelete) {
      const { [listToDelete]: deleted, ...remainingLists } = lists;
      setLists(remainingLists);
      localStorage.setItem(LISTS_METADATA_KEY, JSON.stringify(remainingLists));
      if (onMetadataChange) onMetadataChange(remainingLists);
      localStorage.removeItem(LIST_DATA_PREFIX + listToDelete);
      
      // If this was the current list, clear it
      if (localStorage.getItem('currentJsonListId') === listToDelete) {
        localStorage.removeItem('currentJsonListId');
      }
      
      setShowConfirmation(false);
      setListToDelete(null);
    }
  };

  const handleExport = async (e, listId) => {
    e.stopPropagation();
    setMenuOpenListId(null);
    
    try {
      const listData = JSON.parse(localStorage.getItem(LIST_DATA_PREFIX + listId) || '{}');
      const exportData = {
        title: lists[listId].title,
        data: listData,
        timestamp: Date.now()
      };
      await navigator.clipboard.writeText(JSON.stringify(exportData));
      alert('List exported and copied to clipboard!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export list');
    }
  };

  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const importData = JSON.parse(text);
      
      if (!importData.title || !importData.data) {
        throw new Error('Invalid list format');
      }

      const newList = {
        id: Date.now().toString(),
        title: importData.title,
        timestamp: Date.now()
      };

      // Save metadata
      const updatedLists = { ...lists, [newList.id]: newList };
      setLists(updatedLists);
      localStorage.setItem(LISTS_METADATA_KEY, JSON.stringify(updatedLists));
      if (onMetadataChange) onMetadataChange(updatedLists);

      // Save data
      localStorage.setItem(LIST_DATA_PREFIX + newList.id, JSON.stringify(importData.data));
      
      // Set as current
      localStorage.setItem('currentJsonListId', newList.id);
      alert('List imported successfully!');
    } catch (error) {
      alert('Failed to import list. Make sure the clipboard contains a valid list.');
    }
  };

  return (
    <>
      <SlidePanel title="Lists" isOpen={isOpen} setIsOpen={setIsOpen}>
        <div className="list-history">
          <button className="new-list-button" onClick={handleNewList}>
            + New List
          </button>
          <button className="import-list-button" onClick={handleImport}>
            Import List
          </button>
          <div className="list-items">
            {Object.entries(lists)
              .sort(([, a], [, b]) => b.timestamp - a.timestamp)
              .map(([listId, list]) => {
                const isEditing = listId === editingListId;
                const showMenu = listId === menuOpenListId;

                return (
                  <div
                    key={listId}
                    className="list-item"
                    onClick={() => {
                      if (!isEditing) {
                        // Load data only when clicked
                        const listData = localStorage.getItem(LIST_DATA_PREFIX + listId);
                        if (listData) {
                          localStorage.setItem('currentJsonListId', listId);
                          onLoadNote(JSON.parse(listData), lists[listId].title);
                          setCurrentListId(listId);
                          setIsOpen(false);
                        }
                      }
                    }}
                  >
                    {isEditing ? (
                      <form onSubmit={(e) => handleRename(e, listId)} className="list-edit-form">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          autoFocus
                          onBlur={() => setEditingListId(null)}
                        />
                      </form>
                    ) : (
                      <div className="list-item-content">
                        <span className="list-title">{list.title}</span>
                        <button
                          className="list-menu-button"
                          onClick={(e) => handleMenuClick(e, listId)}
                        >
                          ⋮
                        </button>
                        {showMenu && (
                          <div className="list-menu">
                            <button onClick={(e) => startEditing(e, listId, list.title)}>
                              Rename
                            </button>
                            <button onClick={(e) => handleExport(e, listId)}>
                              Export
                            </button>
                            <button onClick={(e) => confirmDelete(e, listId)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </SlidePanel>

      {showConfirmation && (
        <ConfirmationBox
          message="Are you sure you want to delete this list?"
          onConfirm={handleDelete}
          onCancel={() => {
            setShowConfirmation(false);
            setListToDelete(null);
          }}
        />
      )}
    </>
  );
}

export default JsonListNotes;
