import React, { useState, useRef, useEffect } from 'react';
import './NestedList.css';
import { ellipsis } from '../../Global/functions';
import { useSelector } from 'react-redux';
import DotMenu from '../../Components/DotMenu';

// Recursive component for rendering individual items
export default function NestedListItem({ item, index, depth = 0, path = [], updateContent, moveItem, duplicateItem, addAfter, deleteItemButtonClick, setAsRoot, toggleOpen, insertInto }) {
  // State for UI interactions
  const textareaRef = useRef(null);
  const { settings } = useSelector(state => state.menu);
  
  // Check if this item has nested items
  const hasNested = item.nested && item.nested.length > 0;
  
  // Create a preview of the content (truncate if too long)
  const textPreview = item.content.length > 60 
    ? item.content.slice(0, 60) + '...' 
    : item.content;
  

  // Auto-resize textarea when content changes or when it becomes visible
  useEffect(() => {
    if (item.isOpen && textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set the height to match the content
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [item.isOpen, item?.content]);

  // Handle key press events
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // If shift key is pressed, allow default behavior
      if (e.shiftKey) return;

      // Alt + Enter inserts into
      if (e.altKey && settings.newLineOnEnter) {
        e.preventDefault();
        insertInto(path);
        return;
      }

      // Regular Enter inserts after (when the setting is true)
      if (settings.newLineOnEnter) {
        e.preventDefault();
        addAfter(path);
      }
    }
  };

  return (
    <div className="nested-list-item" >
      <div className="nested-item-header" onClick={() => toggleOpen(path)}>
        <div className="header-content">
          <span className={`arrow ${item.isOpen ? 'open' : ''}`}>▶</span>
          <div className="nested-title">
            <div className="content-text">
              {item.isOpen ? 
                <textarea 
                  ref={textareaRef}
                  id={"textarea-"+item.id}
                  defaultValue={item?.content} 
                  onClick={(e) => { e.stopPropagation() }}
                  onKeyDown={handleKeyPress}
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
              <DotMenu>
                {/* Add After */}
                <button onClick={(e) => {
                  addAfter(path);
                }}>Add After</button>

                {/* Insert Into */}
                <button onClick={(e) => {
                  insertInto(path);
                }}>Insert Into</button>

                {/* Move Up */}
                <button onClick={(e) => {
                  moveItem(path, 'up');
                }}>Move Up</button>

                {/* Move Down */}
                <button onClick={(e) => {
                  moveItem(path, 'down');
                }}>Move Down</button>

                {/* Duplicate */}
                <button onClick={(e) => {
                  duplicateItem(path);
                }}>Duplicate</button>

                {/* Delete */}
                <button onClick={(e) => {
                  deleteItemButtonClick(item, path);
                }}>Delete</button>

                {/* Set As Root */}
                <button onClick={(e) => {
                  setAsRoot(path);
                }}>Set as Root</button>

                {/* Cancel (close menu) */}
                <button>Cancel</button>
              
              </DotMenu>
             
          </div>
        </div>
      </div>
      
      {/* Render nested items when expanded */}
      {item.isOpen && hasNested && (
        <div className="nested-children">
          {item.nested.map((nestedItem, nestedIndex) => (
            <NestedListItem
              key={nestedItem.id}
              item={nestedItem}
              index={nestedIndex}
              depth={depth + 1}
              path={[...path, nestedIndex]}
              updateContent={updateContent}
              moveItem={moveItem}
              duplicateItem={duplicateItem}
              addAfter={addAfter}
              deleteItemButtonClick={deleteItemButtonClick}
              setAsRoot={setAsRoot}
              toggleOpen={toggleOpen}
              insertInto={insertInto}
            />
          ))}
        </div>
      )}
    </div>
  );
}