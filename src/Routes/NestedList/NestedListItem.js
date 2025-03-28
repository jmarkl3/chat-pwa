import React, { useState } from 'react';
import './NestedList.css';

// Recursive component for rendering individual items
export default function NestedListItem({ item, index, depth = 0, path = [] }) {
  // State for UI interactions
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Check if this item has nested items
  const hasNested = item.nested && item.nested.length > 0;
  
  // Create a preview of the content (truncate if too long)
  const textPreview = item.content.length > 60 
    ? item.content.slice(0, 60) + '...' 
    : item.content;
  
  // Toggle expansion of nested items
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // Toggle the action menu
  const toggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="nested-list-item" style={{ paddingLeft: `${depth * 20}px` }}>
      <div className="nested-item-header" onClick={toggleOpen}>
        <div className="header-content">
          <span className={`arrow ${isOpen ? 'open' : ''}`}>▶</span>
          <div className="nested-title">
            <div className="content-text">
              {isOpen ? item.content : textPreview}
            </div>
            <div className="menu-container">
              <button 
                className="menu-button" 
                onClick={toggleMenu}
                aria-label="Menu"
              >⋮</button>
              
              {menuOpen && (
                <div className="nested-menu">
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}>Add After</button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}>Add Inside</button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}>Duplicate</button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}>Delete</button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}>Move Up</button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}>Move Down</button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}>Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Render nested items when expanded */}
      {isOpen && hasNested && (
        <div className="nested-children">
          {item.nested.map((nestedItem, nestedIndex) => (
            <NestedListItem
              key={nestedIndex}
              item={nestedItem}
              index={nestedIndex}
              depth={depth + 1}
              path={[...path, index]}
            />
          ))}
        </div>
      )}
    </div>
  );
}