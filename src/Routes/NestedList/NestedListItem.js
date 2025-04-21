import React, { useState, useRef, useEffect } from 'react';
import './NestedList.css';
import { ellipsis } from '../../Global/functions';
import { useDispatch, useSelector } from 'react-redux';
import DotMenu from '../../Components/DotMenu';
import { setRootPath, setCopyListItemPath, setCutListItemPath, setListData, clearClipboardPaths } from '../../store/listSlice';
import { moveListItemUp, moveListItemDown, updateListItemContent, pasteAfter, pasteInto, toggleOpen, insertInto, duplicateListItem, addAfterListItem } from './ListFunctions';

// Recursive component for rendering individual items
export default function NestedListItem({ item, depth = 0, path = [], deleteItemButtonClick }) {
  // State for UI interactions
  const textareaRef = useRef(null);
  const { settings } = useSelector(state => state.menu);
  const { copyListItemPath, cutListItemPath, selectedListID } = useSelector(state => state.list);
  const dispatch = useDispatch();

  // Check if this item is selected for copy or cut
  const isSelected = 
    (copyListItemPath && JSON.stringify(copyListItemPath) === JSON.stringify(path)) || 
    (cutListItemPath && JSON.stringify(cutListItemPath) === JSON.stringify(path));

  // Check if there's an item in clipboard (copy or cut)
  const hasClipboardItem = copyListItemPath !== null || cutListItemPath !== null;

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
        const newId = insertInto(selectedListID, path, (updatedData) => {
          dispatch(setListData(updatedData));
        });
        
        // Focus the new textarea
        setTimeout(() => {
          let newItemInput = document.getElementById("textarea-"+newId);
          if(newItemInput)
            newItemInput.focus();
        }, 100);
        
        return;
      }

      // Regular Enter inserts after (when the setting is true)
      if (settings.newLineOnEnter) {
        e.preventDefault();
        const newId = addAfterListItem(selectedListID, path, (updatedData) => {
          dispatch(setListData(updatedData));
        });
        
        // Focus the new textarea
        setTimeout(() => {
          let newItemInput = document.getElementById("textarea-"+newId);
          if(newItemInput)
            newItemInput.focus();
        }, 100);
      }
    }
  };

  // Handle content change
  const handleContentChange = (newContent) => {
    updateListItemContent(selectedListID, path, newContent, (updatedData) => {
      dispatch(setListData(updatedData));
    });
  };

  // Handle toggle open/close
  const handleToggleOpen = () => {
    toggleOpen(selectedListID, path, (updatedData) => {
      dispatch(setListData(updatedData));
    });
  };

  return (
    <div className="nested-list-item" >
      <div className={`nested-item-header ${isSelected ? 'selected-item' : ''}`} onClick={handleToggleOpen}>
        {/* Arrow */}
        <span className={`arrow ${item.isOpen ? 'open' : ''}`}>▶</span>
        
        {/* Text and dot menu */}
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
                  // Update content using our function
                  handleContentChange(e.target.value);
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
              const newId = addAfterListItem(selectedListID, path, (updatedData) => {
                dispatch(setListData(updatedData));
              });
              
              // Focus the new textarea
              setTimeout(() => {
                let newItemInput = document.getElementById("textarea-"+newId);
                if(newItemInput)
                  newItemInput.focus();
              }, 100);
            }}>Add After</button>

            {/* Insert Into */}
            <button onClick={(e) => {
              const newId = insertInto(selectedListID, path, (updatedData) => {
                dispatch(setListData(updatedData));
              });
              
              // Focus the new textarea
              setTimeout(() => {
                let newItemInput = document.getElementById("textarea-"+newId);
                if(newItemInput)
                  newItemInput.focus();
              }, 100);
            }}>Insert Into</button>

            {/* Move Up */}
            <button onClick={(e) => {
              moveListItemUp(selectedListID, path, (updatedData) => {
                dispatch(setListData(updatedData));
              });
            }}>Move Up</button>

            {/* Move Down */}
            <button onClick={(e) => {
              moveListItemDown(selectedListID, path, (updatedData) => {
                dispatch(setListData(updatedData));
              });
            }}>Move Down</button>

            {/* Duplicate */}
            <button onClick={(e) => {
              duplicateListItem(selectedListID, path, (updatedData) => {
                dispatch(setListData(updatedData));
              });
            }}>Duplicate</button>

            {/* Copy */}
            <button onClick={(e) => {
              dispatch(setCopyListItemPath([...path]));
            }}>Copy</button>

            {/* Cut */}
            <button onClick={(e) => {
              dispatch(setCutListItemPath([...path]));
            }}>Cut</button>

            {/* Paste After - only show if there's something in clipboard */}
            {hasClipboardItem && (
              <button onClick={(e) => {
                pasteAfter(selectedListID, path, copyListItemPath, cutListItemPath, 
                  (updatedData) => {
                    dispatch(setListData(updatedData));
                  },
                  () => {
                    dispatch(clearClipboardPaths());
                  }
                );
              }}>Paste After</button>
            )}

            {/* Paste Into - only show if there's something in clipboard */}
            {hasClipboardItem && (
              <button onClick={(e) => {
                pasteInto(selectedListID, path, copyListItemPath, cutListItemPath, 
                  (updatedData) => {
                    dispatch(setListData(updatedData));
                  },
                  () => {
                    dispatch(clearClipboardPaths());
                  }
                );
              }}>Paste Into</button>
            )}

            {/* Delete */}
            <button onClick={(e) => {
              deleteItemButtonClick(item, path);
            }}>Delete</button>

            {/* Set As Root */}
            <button onClick={(e) => {
              dispatch(setRootPath([...path]));
            }}>Set as Root</button>

            {/* Cancel (close menu) */}
            <button>Cancel</button>
          
          </DotMenu>
            
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
              deleteItemButtonClick={deleteItemButtonClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}