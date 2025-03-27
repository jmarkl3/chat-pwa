import React, { useState, useEffect } from 'react';
import './JsonList.css';
import JsonListMenu from './JsonListMenu';
import JsonListSettings from './JsonListSettings';
import JsonListNotes from './JsonListNotes';

const emptyData = {
  0: {
    content: 'New Item',
    nested: {}
  }
};

function ConfirmationBox({ message, onConfirm, onCancel }) {
  return (
    <div className="confirmation-box">
      <p>{message}</p>
      <div>
        <button className="confirm" onClick={onConfirm}>Yes</button>
        <button className="cancel" onClick={onCancel}>No</button>
      </div>
    </div>
  );
}

function NoteListItem({ item, index, depth = 0, path = [], onUpdate, onDelete, onDuplicate, onMove, onAdd, onAddNested }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [contentValue, setContentValue] = useState(item.content);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  const hasNested = Object.keys(item.nested || {}).length > 0;
  const textPreview = item.content.split('\n')[0].slice(0, 60) + (item.content.length > 60 ? '...' : '');
  
  const handleContentSubmit = () => {
    if (contentValue !== item.content) {
      const newItem = { ...item, content: contentValue };
      onUpdate([...path, index], newItem);
    }
    setEditingContent(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setEditingContent(false);
      setContentValue(item.content);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete([...path, index]);
    setShowDeleteConfirm(false);
    setMenuOpen(false);
  };

  const handleDuplicate = () => {
    onDuplicate([...path, index]);
    setMenuOpen(false);
  };

  const handleMoveUp = () => {
    onMove([...path, index], 'up');
    setMenuOpen(false);
  };

  const handleMoveDown = () => {
    onMove([...path, index], 'down');
    setMenuOpen(false);
  };

  const handleAdd = () => {
    onAdd([...path, index]);
    setMenuOpen(false);
  };

  const handleAddNested = () => {
    onAddNested([...path, index]);
    setMenuOpen(false);
    if (!isOpen) setIsOpen(true);
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!menuOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.top - 4,
        left: rect.right - 140
      });
    }
    setMenuOpen(!menuOpen);
  };

  const renderMenu = () => (
    <div className="json-menu" style={{ top: menuPosition.top, left: menuPosition.left }}>
      <button onClick={(e) => { e.stopPropagation(); handleAdd(); }}>Add After</button>
      <button onClick={(e) => { e.stopPropagation(); handleAddNested(); }}>Add Inside</button>
      <button onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}>Duplicate</button>
      <button onClick={(e) => { e.stopPropagation(); handleDelete(); }}>Delete</button>
      <button onClick={(e) => { e.stopPropagation(); handleMoveUp(); }}>Move Up</button>
      <button onClick={(e) => { e.stopPropagation(); handleMoveDown(); }}>Move Down</button>
      <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}>Cancel</button>
    </div>
  );

  return (
    <>
      <div className="note-list-item" style={{ paddingLeft: `${depth * 20}px` }}>
        <div className="note-item-header" onClick={toggleOpen}>
          <div className="header-content">
            <span className={`arrow ${isOpen ? 'open' : ''}`}>▶</span>
            <div className="note-title" onClick={(e) => {
              e.stopPropagation();
              if (!editingContent) {
                setEditingContent(true);
                setIsOpen(true);
              }
            }}>
              {editingContent ? (
                <textarea
                  value={contentValue}
                  onChange={(e) => setContentValue(e.target.value)}
                  onBlur={handleContentSubmit}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="content-input"
                  onClick={(e) => e.stopPropagation()}
                  rows={contentValue.split('\n').length}
                />
              ) : (
                <div className="content-text">
                  {isOpen ? item.content : textPreview}
                </div>
              )}
              <button 
                className="menu-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu(e);
                }}
              >⋮</button>
            </div>
          </div>
          {menuOpen && renderMenu()}
        </div>
        
        {/* Nested items */}
        {isOpen && hasNested && (
          <div className="note-children">
            {Object.entries(item.nested)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([key, value]) => (
                <NoteListItem
                  key={key}
                  item={value}
                  index={key}
                  depth={depth + 1}
                  path={[...path, index, 'nested']}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onMove={onMove}
                  onAdd={onAdd}
                  onAddNested={onAddNested}
                />
              ))}
          </div>
        )}
      </div>
      
      {showDeleteConfirm && (
        <ConfirmationBox
          message="Are you sure you want to delete this item?"
          onConfirm={(e) => { e?.stopPropagation(); confirmDelete(); }}
          onCancel={(e) => { e?.stopPropagation(); setShowDeleteConfirm(false); setMenuOpen(false); }}
        />
      )}
    </>
  );
}

function NoteList() {
  const [data, setData] = useState(emptyData);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [currentListId, setCurrentListId] = useState(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [metadata, setMetadata] = useState({});

  // Load current list from localStorage on mount
  useEffect(() => {
    const savedListId = localStorage.getItem('currentJsonListId');
    if (savedListId) {
      const listData = localStorage.getItem('jsonList_' + savedListId);
      if (listData) {
        setCurrentListId(savedListId);
        setData(JSON.parse(listData));
        
        // Load title from metadata
        const lists = JSON.parse(localStorage.getItem('jsonListsMetadata') || '{}');
        setMetadata(lists);
        if (lists[savedListId]) {
          setCurrentTitle(lists[savedListId].title || 'Untitled List');
        }
      }
    }
  }, []);

  const handleLoadNote = (noteData, title) => {
    setData(noteData);
    setCurrentTitle(title || 'Untitled List');
  };

  const handleTitleChange = (newTitle) => {
    const title = newTitle.trim() || 'Untitled List';
    setCurrentTitle(title);
    setIsEditingTitle(false);

    if (currentListId) {
      // Update metadata
      const lists = JSON.parse(localStorage.getItem('jsonListsMetadata') || '{}');
      if (lists[currentListId]) {
        lists[currentListId].title = title;
        lists[currentListId].timestamp = Date.now();
        localStorage.setItem('jsonListsMetadata', JSON.stringify(lists));
        setMetadata(lists); // Update local metadata state
      }
    }
  };

  const handleTitleSubmit = (e) => {
    e.preventDefault();
    handleTitleChange(currentTitle);
  };

  const handleTitleBlur = () => {
    handleTitleChange(currentTitle);
  };

  const handleMetadataChange = (newMetadata) => {
    setMetadata(newMetadata);
    // Update current title if this is the current list
    if (currentListId && newMetadata[currentListId]) {
      setCurrentTitle(newMetadata[currentListId].title || 'Untitled List');
    }
  };

  // Save changes to localStorage
  const saveCurrentList = (newData) => {
    if (currentListId) {
      // Save the actual list data
      localStorage.setItem('jsonList_' + currentListId, JSON.stringify(newData));
      
      // Update timestamp in metadata
      const lists = JSON.parse(localStorage.getItem('jsonListsMetadata') || '{}');
      if (lists[currentListId]) {
        lists[currentListId].timestamp = Date.now();
        localStorage.setItem('jsonListsMetadata', JSON.stringify(lists));
      }
    }
  };

  const handleUpdate = (path, newValue) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    // Navigate to the parent of the target property
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    // Update the target property
    current[path[path.length - 1]] = newValue;
    setData(newData);
    saveCurrentList(newData);
  };

  const handleDelete = (path) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    // Navigate to the parent of the target property
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    // Delete the target property
    delete current[path[path.length - 1]];
    setData(newData);
    saveCurrentList(newData);
  };

  const handleDuplicate = (path) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    // Navigate to the parent of the target property
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    // Find the next available index
    const keys = Object.keys(current).map(Number);
    const nextIndex = keys.length > 0 ? Math.max(...keys) + 1 : 0;
    
    // Copy the item
    current[nextIndex] = JSON.parse(JSON.stringify(current[path[path.length - 1]]));
    setData(newData);
    saveCurrentList(newData);
  };

  const handleMove = (path, direction) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    // Navigate to the parent of the target property
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    const index = path[path.length - 1];
    const keys = Object.keys(current).map(Number).sort((a, b) => a - b);
    const currentIndex = keys.indexOf(Number(index));
    
    if (direction === 'up' && currentIndex > 0) {
      const prevKey = keys[currentIndex - 1];
      const temp = current[prevKey];
      current[prevKey] = current[index];
      current[index] = temp;
    } else if (direction === 'down' && currentIndex < keys.length - 1) {
      const nextKey = keys[currentIndex + 1];
      const temp = current[nextKey];
      current[nextKey] = current[index];
      current[index] = temp;
    }
    
    setData(newData);
    saveCurrentList(newData);
  };

  const handleAdd = (path) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    // Navigate to the parent of the target property
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    // Find the next available index after the current item
    const keys = Object.keys(current).map(Number);
    const currentIndex = Number(path[path.length - 1]);
    const keysAfter = keys.filter(k => k > currentIndex);
    const nextIndex = keysAfter.length > 0 ? Math.min(...keysAfter) : currentIndex + 1;
    
    // Shift all items after the insertion point
    for (let i = keys.length - 1; i >= 0; i--) {
      const key = keys[i];
      if (key >= nextIndex) {
        current[key + 1] = current[key];
        delete current[key];
      }
    }
    
    // Add the new item
    current[nextIndex] = {
      content: 'New Item',
      nested: {}
    };
    
    setData(newData);
    saveCurrentList(newData);
  };

  const handleAddNested = (path) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    // Navigate to the target property
    for (const key of path) {
      current = current[key];
    }
    
    // Add a new item to the nested object
    const keys = Object.keys(current.nested).map(Number);
    const nextIndex = keys.length > 0 ? Math.max(...keys) + 1 : 0;
    
    current.nested[nextIndex] = {
      content: 'New Item',
      nested: {}
    };
    
    setData(newData);
    saveCurrentList(newData);
  };

  return (
    <div className="note-list-container">
      <div className="header">
        <h2>
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit}>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="title-input"
              />
            </form>
          ) : (
            <span onClick={() => setIsEditingTitle(true)}>
              {currentTitle || 'Untitled List'}
            </span>
          )}
        </h2>
      </div>
      <div className="note-list">
        {Object.entries(data)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([key, value]) => (
            <NoteListItem
              key={key}
              item={value}
              index={key}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onMove={handleMove}
              onAdd={handleAdd}
              onAddNested={handleAddNested}
            />
          ))}
        <div style={{ height: '200px' }} />
      </div>

      <JsonListMenu
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
        setShowSettings={setShowSettings}
        setShowNotes={setShowNotes}
      />

      <JsonListSettings
        isOpen={showSettings}
        setIsOpen={setShowSettings}
      />

      <JsonListNotes
        isOpen={showNotes}
        setIsOpen={setShowNotes}
        onLoadNote={handleLoadNote}
        setCurrentListId={setCurrentListId}
        onMetadataChange={handleMetadataChange}
      />
    </div>
  );
}

export default NoteList;
