import React, { useState, useRef, useEffect } from 'react';
import './NestedList.css';
import { ellipsis } from '../App/functions';

// Recursive component for rendering individual items
export default function NestedListItem({ item, index, depth = 0, path = [], updateContent }) {
  // State for UI interactions
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const textareaRef = useRef(null);
  
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

  // Auto-resize textarea when content changes or when it becomes visible
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set the height to match the content
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isOpen, item?.content]);

  return (
    <div className="nested-list-item" style={{ paddingLeft: `${depth * 20}px` }}>
      <div className="nested-item-header" onClick={toggleOpen}>
        <div className="header-content">
          <span className={`arrow ${isOpen ? 'open' : ''}`}>▶</span>
          <div className="nested-title">
            <div className="content-text">
              {isOpen ? 
                <textarea 
                  ref={textareaRef}
                  defaultValue={item?.content} 
                  onClick={(e) => { e.stopPropagation() }}
                  onChange={(e) => {
                    // Adjust height on content change
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                    // Update content in parent
                    updateContent(e.target.value, path);
                  }}
                  style={{
                    width: '100%',
                    overflow: 'hidden',
                    resize: 'none',
                    minHeight: '20px'
                  }}
                /> 
                :
                ellipsis(item?.content) 
              }
            </div>
              <div className={"note-list-item-menu"}>
                <button 
                  className="menu-button" 
                  onClick={toggleMenu}
                  aria-label="Menu"
                >⋮</button>
                <div 
                  className={"note-list-item-menu-inner "+ (menuOpen ? "note-list-item-menu-inner-open" : "")}
                > 
                
                  <button onClick={toggleMenu}>Set As Root</button>
                  <button onClick={toggleMenu}>Move Up</button>
                  <button onClick={toggleMenu}>Move Down</button>
                  <button onClick={toggleMenu}>Duplicate</button>
                  <button onClick={toggleMenu}>Add After</button>
                  <button onClick={toggleMenu}>Delete</button>
                  <button onClick={toggleMenu}>Cancel</button>
                </div>

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
              path={[...path, nestedIndex]}
              updateContent={updateContent}
            />
          ))}
        </div>
      )}
    </div>
  );
}