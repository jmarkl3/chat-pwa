import React, { useState } from 'react';
import ConfirmationBox from '../App/ConfirmationBox';
import './JsonList.css';

// Helper function to add _order to all objects in the data
function addOrderToData(data) {
  const result = {};
  Object.entries(data).forEach(([key, value], index) => {
    result[key] = {
      ...value,
      _order: index
    };
    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue], subIndex) => {
        if (subKey !== '_order') {
          if (subValue && typeof subValue === 'object') {
            result[key][subKey] = {
              ...addOrderToData(subValue),
              _order: subIndex
            };
          } else {
            result[key][subKey] = subValue;
          }
        }
      });
    }
  });
  return result;
}

// Sample JSON data with 3 levels and 12 items
const initialData = addOrderToData({
  personal: {
    name: "John Doe",
    age: 32,
    contact: {
      email: "john@example.com",
      phone: "555-0123",
      address: {
        street: "123 Main St",
        city: "Springfield",
        country: "USA"
      }
    }
  },
  professional: {
    title: "Software Engineer",
    experience: {
      years: 8,
      skills: ["JavaScript", "React", "Node.js"],
      projects: {
        current: "Web App Development",
        completed: 15
      }
    }
  }
});

function JsonListItem({ label, value, depth = 0, path = [], onUpdate, onDelete, onDuplicate, onMove, onRename, onAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(label);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const isExpandable = value !== null && typeof value === 'object';
  
  // Handle label edit completion
  const handleLabelSubmit = () => {
    if (labelValue !== label) {
      onRename([...path], label, labelValue);
    }
    setEditingLabel(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      setEditingLabel(false);
      setLabelValue(label);
    }
  };

  const toggleOpen = () => {
    if (isExpandable) {
      setIsOpen(!isOpen);
    }
  };

  const handleValueChange = (newValue) => {
    try {
      const firstChar = newValue.trim()[0];
      const lastChar = newValue.trim()[newValue.trim().length - 1];
      if ((firstChar === '[' && lastChar === ']') || 
          (firstChar === '{' && lastChar === '}')) {
        newValue = JSON.parse(newValue);
      } else if (!isNaN(newValue) && newValue.trim() !== '') {
        newValue = Number(newValue);
      }
    } catch (e) {
      // If parsing fails, keep it as string
    }
    onUpdate([...path, label], newValue);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete([...path, label]);
    setShowDeleteConfirm(false);
    setMenuOpen(false);
  };

  const handleDuplicate = () => {
    onDuplicate([...path, label]);
    setMenuOpen(false);
  };

  const handleMoveUp = () => {
    onMove([...path, label], 'up');
    setMenuOpen(false);
  };

  const handleMoveDown = () => {
    onMove([...path, label], 'down');
    setMenuOpen(false);
  };

  const handleAdd = () => {
    onAdd([...path, label]);
    setMenuOpen(false);
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!menuOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.top - 4,  // 4px gap above the button
        left: rect.right - 120  // menu width is 120px
      });
    }
    setMenuOpen(!menuOpen);
  };

  const renderMenu = () => (
    <div className="json-menu" style={{ top: menuPosition.top, left: menuPosition.left }}>
      <button onClick={handleAdd}>Add Item</button>
      <button onClick={handleDuplicate}>Duplicate</button>
      <button onClick={handleDelete}>Delete</button>
      <button onClick={handleMoveUp}>Move Up</button>
      <button onClick={handleMoveDown}>Move Down</button>
      <button onClick={() => setMenuOpen(false)}>Cancel</button>
    </div>
  );

  const renderValue = () => {
    if (!isExpandable) {
      return (
        <div className="json-value-container">
          <div className="json-header">
            <div className="json-label" onClick={() => setEditingLabel(true)}>
              {editingLabel ? (
                <input
                  type="text"
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  onBlur={handleLabelSubmit}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="label-input"
                />
              ) : (
                <span>{label}:</span>
              )}
            </div>
            <button className="menu-button" onClick={toggleMenu}>⋮</button>
            {menuOpen && renderMenu()}
          </div>
          <textarea
            className="json-textarea"
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            onChange={(e) => handleValueChange(e.target.value)}
            rows={1}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
        </div>
      );
    }
    
    return (
      <>
        <div className="json-item-header">
          <div className="header-content" onClick={toggleOpen}>
            <span className={`arrow ${isOpen ? 'open' : ''}`}>▶</span>
            <div className="json-label" onClick={(e) => {
              e.stopPropagation();
              setEditingLabel(true);
            }}>
              {editingLabel ? (
                <input
                  type="text"
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  onBlur={handleLabelSubmit}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="label-input"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span>{label}:</span>
              )}
            </div>
          </div>
          <button className="menu-button" onClick={toggleMenu}>⋮</button>
          {menuOpen && renderMenu()}
        </div>
        {isOpen && (
          <div className="json-children">
            {Object.entries(value)
              .filter(([key]) => key !== '_order')
              .sort(([, a], [, b]) => (a._order || 0) - (b._order || 0))
              .map(([key, val]) => (
                <JsonListItem
                  key={key}
                  label={key}
                  value={val}
                  depth={depth + 1}
                  path={[...path, label]}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onMove={onMove}
                  onRename={onRename}
                  onAdd={onAdd}
                />
              ))}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="json-list-item" >
        {renderValue()}
      </div>
      {showDeleteConfirm && (
        <ConfirmationBox
          message="Are you sure you want to delete this item?"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setMenuOpen(false);
          }}
        />
      )}
    </>
  );
}

function JsonList() {
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
    setData(newData);
  };

  const handleDuplicate = (path) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    const originalKey = path[path.length - 1];
    const newKey = `${originalKey}_copy`;
    const originalValue = current[originalKey];
    
    // Deep clone the value
    const newValue = JSON.parse(JSON.stringify(originalValue));
    
    // Get all items at this level
    const items = Object.entries(current)
      .filter(([k]) => k !== '_order')
      .sort(([, a], [, b]) => (a._order || 0) - (b._order || 0));
    
    // Find the index of the original item
    const originalIndex = items.findIndex(([k]) => k === originalKey);
    const originalOrder = items[originalIndex][1]._order || 0;
    
    // Update orders: increment all items after the original
    items.forEach(([key, value]) => {
      if ((value._order || 0) > originalOrder) {
        current[key]._order = (value._order || 0) + 1;
      }
    });
    
    // Set the new item's order to be right after the original
    if (typeof newValue === 'object') {
      newValue._order = originalOrder + 1;
    }
    
    current[newKey] = newValue;
    setData(newData);
  };

  const handleAdd = (path) => {
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    const items = Object.entries(current)
      .filter(([k]) => k !== '_order')
      .sort(([, a], [, b]) => (a._order || 0) - (b._order || 0));
    
    const targetKey = path[path.length - 1];
    const targetIndex = items.findIndex(([k]) => k === targetKey);
    const targetOrder = items[targetIndex][1]._order || 0;
    
    // Update orders: increment all items after the target
    items.forEach(([key, value]) => {
      if ((value._order || 0) > targetOrder) {
        current[key]._order = (value._order || 0) + 1;
      }
    });
    
    // Create new item with order after target
    const newItemKey = `item_${items.length}`;
    current[newItemKey] = {
      _order: targetOrder + 1,
      value: ""
    };
    
    setData(newData);
  };

  const handleRename = (path, oldKey, newKey) => {
    if (oldKey === newKey) return;
    
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    for (let i = 0; i < path.length; i++) {
      current = current[path[i]];
    }
    
    // Only rename if the new key doesn't exist
    if (!current[newKey]) {
      const value = current[oldKey];
      delete current[oldKey];
      current[newKey] = value;
      setData(newData);
    }
  };

  const handleMove = (path, direction) => {
    console.log(`\n=== Starting ${direction} move for path:`, path);
    
    // Create a copy of the current data
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    
    // Navigate to the parent object containing our target item
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    // Get the key of our target item
    const targetKey = path[path.length - 1];
    console.log('Target key:', targetKey);
    
    // Get all items at this level
    const itemsAtLevel = Object.entries(current)
      .filter(([key]) => key !== '_order');
    console.log('All items at this level:', itemsAtLevel.map(([k]) => k));
    
    // Sort them by order
    const items = itemsAtLevel
      .sort(([, a], [, b]) => (a._order || 0) - (b._order || 0));
    console.log('Items sorted by order:', 
      items.map(([k, v]) => `${k}(${v._order})`).join(', '));
    
    // Find current item's position
    const currentIndex = items.findIndex(([key]) => key === targetKey);
    console.log('Current item index:', currentIndex);
    
    if (direction === 'up' && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevKey = items[prevIndex][0];
      
      console.log(`Moving ${targetKey}(${current[targetKey]._order}) up, ` +
                 `swapping with ${prevKey}(${current[prevKey]._order})`);
      
      // Store original orders
      const targetOrder = current[targetKey]._order;
      const prevOrder = current[prevKey]._order;
      
      // Update orders
      current[targetKey]._order = prevOrder;
      current[prevKey]._order = targetOrder;
      
      console.log('New orders:', 
        `${targetKey}(${current[targetKey]._order}), ` +
        `${prevKey}(${current[prevKey]._order})`);
      
    } else if (direction === 'down' && currentIndex < items.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextKey = items[nextIndex][0];
      
      console.log(`Moving ${targetKey}(${current[targetKey]._order}) down, ` +
                 `swapping with ${nextKey}(${current[nextKey]._order})`);
      
      // Store original orders
      const targetOrder = current[targetKey]._order;
      const nextOrder = current[nextKey]._order;
      
      // Update orders
      current[targetKey]._order = nextOrder;
      current[nextKey]._order = targetOrder;
      
      console.log('New orders:', 
        `${targetKey}(${current[targetKey]._order}), ` +
        `${nextKey}(${current[nextKey]._order})`);
    }
    
    // Log final state
    console.log('Final state:', Object.entries(current)
      .filter(([k]) => k !== '_order')
      .sort(([, a], [, b]) => (a._order || 0) - (b._order || 0))
      .map(([k, v]) => `${k}(${v._order})`).join(', '));
    
    // Update state with our modified data
    setData(newData);
  };

  return (
    <div className="json-list-container">
      <h2>JSON Tree View</h2>
      <div className="json-list">
        {Object.entries(data)
          .sort(([, a], [, b]) => (a._order || 0) - (b._order || 0))
          .map(([key, value]) => (
            <JsonListItem
              key={key}
              label={key}
              value={value}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onMove={handleMove}
              onRename={handleRename}
              onAdd={handleAdd}
            />
          ))}
        <div style={{ height: '200px' }} /> {/* Add padding space at the bottom */}
      </div>
    </div>
  );
}

export default JsonList;
