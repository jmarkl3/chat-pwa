import React, { useState } from 'react';
import './JsonList.css';

const initialData = {
  0: {
    content: "Books",
    nested: {
      0: {
        content: "Comedy",
        nested: {
          0: {
            content: "Hitchhiker's Guide",
            nested: {}
          },
          1: {
            content: "Good Omens",
            nested: {}
          }
        }
      },
      1: {
        content: "Mystery",
        nested: {
          0: {
            content: "Sherlock Holmes",
            nested: {}
          }
        }
      }
    }
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
  const [data, setData] = useState(initialData);

  const handleUpdate = (path, newValue) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = newValue;
    setData(newData);
  };

  const handleDelete = (path) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    delete current[path[path.length - 1]];
    
    // Reorder remaining items
    const items = Object.entries(current)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));
    
    // Reset indices
    items.forEach(([, value], index) => {
      current[index] = value;
      if (parseInt(index) < items.length - 1) {
        delete current[items[index + 1][0]];
      }
    });
    
    setData(newData);
  };

  const handleDuplicate = (path) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    const items = Object.keys(current).length;
    const originalValue = current[path[path.length - 1]];
    
    // Shift items up
    for (let i = items; i > parseInt(path[path.length - 1]) + 1; i--) {
      current[i] = current[i - 1];
    }
    
    // Insert copy
    current[parseInt(path[path.length - 1]) + 1] = JSON.parse(JSON.stringify(originalValue));
    
    setData(newData);
  };

  const handleAdd = (path) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    const items = Object.keys(current).length;
    
    // Shift items up
    for (let i = items; i > parseInt(path[path.length - 1]) + 1; i--) {
      current[i] = current[i - 1];
    }
    
    // Insert new item
    current[parseInt(path[path.length - 1]) + 1] = {
      content: 'New Item',
      nested: {}
    };
    
    setData(newData);
  };

  const handleAddNested = (path) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    const target = current[path[path.length - 1]];
    if (!target.nested) target.nested = {};
    
    const nestedItems = Object.keys(target.nested).length;
    
    target.nested[nestedItems] = {
      content: 'New Item',
      nested: {}
    };
    
    setData(newData);
  };

  const handleMove = (path, direction) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    const index = parseInt(path[path.length - 1]);
    const items = Object.keys(current).length;
    
    if (direction === 'up' && index > 0) {
      const temp = current[index];
      current[index] = current[index - 1];
      current[index - 1] = temp;
    } else if (direction === 'down' && index < items - 1) {
      const temp = current[index];
      current[index] = current[index + 1];
      current[index + 1] = temp;
    }
    
    setData(newData);
  };

  return (
    <div className="note-list-container">
      <h2>Notes</h2>
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
    </div>
  );
}

export default NoteList;
