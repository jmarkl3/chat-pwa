import React, { useState } from 'react';
import './NestedList.css';
import NestedListItem from './NestedListItem';
import { ellipsis, generateId } from '../../Global/functions';
import ListsSelector from '../../Components/Menus/ListsSelector';
import ConfirmationBox from '../../Components/ConfirmationBox';
import { useDispatch, useSelector } from 'react-redux';
import { setListID } from '../../store/idsSlice';
import "./JsonList.css"
import { setListData, setRootPath, clearClipboardPaths } from '../../store/listSlice';
import { createEmptyList, addIds, testData } from './ListFunctions';

/*
  commands to add:
  update text content of an item
  open or close an item
  reorder things

  it seems it can rename things but it sometimes renames the wrong one
    it was just sending the wrong index for some reason
      maybe including the index in the object tha is sent will help it
      along with examples

      asking it to add items it adds to the wrong places
        like fruits under apple category
      it puts it in the wrong index simetimes too, added index to the text idk if it helped tho
      its note reliable
      says its diong this that it doesn't do

      maybe give it more examples
      and more detailed instructions
      and have this additional text available ony when a list is loaded
      and when a list is loaded the game listData maybe won't be loaded
      also the game listData could be more detailed but only show when a certain game is being played
        so this would need to be saed in a game name ref

*/

function NestedList() {
  
  const dispatch = useDispatch();
  const { selectedListID, listData, rootPath, copyListItemPath, cutListItemPath } = useSelector(state => state.list);

  // State for the nested list listData
  const [deleteItemData, setDeleteItemData] = useState(null);
  // State for tracking the current root path

  // Function to duplicate a node and insert it after the original
  const duplicateItem = (path) => {
    console.log(`Duplicating item at path [${path.join(',')}]`);
    
    // Create a deep copy of the current listData
    const newData = JSON.parse(JSON.stringify(listData));
    
    // If path is empty, we can't duplicate root
    if (path.length === 0) {
      console.log('Cannot duplicate root item');
      return;
    }
    
    // Navigate to the parent that contains the item to duplicate
    let parent = newData;
    for (let i = 0; i < path.length - 1; i++) {
      parent = parent.nested[path[i]];
    }
    console.log('Found parent:', parent.content);
    
    // Get the array of items and current index
    const items = parent.nested;
    const currentIndex = path[path.length - 1];
    
    // Create deep copy of the item to duplicate
    const duplicatedItem = JSON.parse(JSON.stringify(items[currentIndex]));
    // Give the duplicated item and all its nested items new IDs
    addIds(duplicatedItem);
    console.log('Duplicating item:', duplicatedItem.content);
    
    // Insert the duplicate after the original
    items.splice(currentIndex + 1, 0, duplicatedItem);
    console.log('New array length:', items.length);
    
    // Update the state with the new listData
    dispatch(setListData(newData))
  };

  // Function to add an empty node after the specified path
  const addAfter = (path) => {
    console.log(`Adding empty node after path [${path.join(',')}]`);
    
    // Create a deep copy of the current listData
    const newData = JSON.parse(JSON.stringify(listData));
    
    // If path is empty, we can't add after root
    if (path.length === 0) {
      console.log('Cannot add after root item');
      return;
    }
    
    // Navigate to the parent that contains the reference item
    let parent = newData;
    for (let i = 0; i < path.length - 1; i++) {
      parent = parent.nested[path[i]];
    }
    console.log('Found parent:', parent.content);
    
    // Get the array of items and current index
    const items = parent.nested;
    const currentIndex = path[path.length - 1];
    
    // Create empty node with same structure
    const newId = generateId();
    const emptyNode = {
      id: newId,
      content: "",
      isOpen: true,
      nested: []
    };
    console.log('Adding empty node after index:', currentIndex);
    
    // Insert the empty node after the current item
    items.splice(currentIndex + 1, 0, emptyNode);
    console.log('New array length:', items.length);
    
    // Update the state with the new listData
    dispatch(setListData(newData))

    setTimeout(() => {
      let newItemInput = document.getElementById("textarea-"+newId)
      if(newItemInput)
        newItemInput.focus()
    }, 100);

    // Return the ID of the newly created item
    return newId;
  };

  const deleteItemButtonClick = (itemData, path) => {
    // Check if confirmation is needed
    const needsConfirmation = itemData.content.length > 10 || (itemData.nested && itemData.nested.length > 0);
    
    if (needsConfirmation) {
      const preview = itemData.content.slice(0, 10) + (itemData.content.length > 10 ? '...' : '');
      const nestedCount = itemData.nested ? itemData.nested.length : 0;
      setDeleteItemData({
        path,
        message: `Delete item "${preview}" with ${nestedCount} nested items?`
      });
    } else {
      // If no confirmation needed, delete immediately
      deleteItem(path);
    }
  };

  // Function to delete a node at the specified path
  const deleteItem = (path) => {
    console.log(`Deleting item at path [${path.join(',')}]`);
    
    // Create a deep copy of the current listData
    const newData = JSON.parse(JSON.stringify(listData));
    
    // If path is empty, we can't delete root
    if (path.length === 0) {
      console.log('Cannot delete root item');
      return;
    }
    
    // Navigate to the parent that contains the item to delete
    let parent = newData;
    for (let i = 0; i < path.length - 1; i++) {
      parent = parent.nested[path[i]];
    }
    console.log('Found parent:', parent.content);
    
    // Get the array of items and target index
    const items = parent.nested;
    const targetIndex = path[path.length - 1];
    
    // Log what we're about to delete
    console.log('Deleting item:', items[targetIndex].content);
    
    // Remove the item
    items.splice(targetIndex, 1);
    console.log('New array length:', items.length);
    
    // Update the state with the new listData
    dispatch(setListData(newData))
  };

  // Function to toggle open/closed state
  const toggleOpen = (path) => {
    console.log('Toggling open state at path:', path);
    
    // Create a deep copy of the current listData
    const newData = JSON.parse(JSON.stringify(listData));
    
    // Navigate to the target node
    let current = newData;
    for (let i = 0; i < path.length; i++) {
      current = current.nested[path[i]];
    }
    
    // Toggle the isOpen state
    current.isOpen = !current.isOpen;
    console.log('New isOpen state:', current.isOpen);
    
    // Update the state with the new listData
    dispatch(setListData(newData))
  };

  // Function to insert a new item inside a node's nested list
  const insertInto = (path) => {
    console.log('Inserting new item into path:', path);
    
    // Create a deep copy of the current listData
    const newData = JSON.parse(JSON.stringify(listData));
    
    // Navigate to the target node
    let current = newData;
    for (let i = 0; i < path.length; i++) {
      current = current.nested[path[i]];
    }
    
    // Create empty node with same structure
    const newId = generateId();
    const emptyNode = {
      id: newId,
      content: "",
      isOpen: true,
      nested: []
    };
    
    // Add the new item to the nested array
    current.nested.push(emptyNode);
    console.log('Added new item to nested array');
    
    // Make sure the parent is open to show the new item
    current.isOpen = true;
    console.log('Opened parent node');
    
    // Update the state with the new listData
    dispatch(setListData(newData))

    setTimeout(() => {
      let newItemInput = document.getElementById("textarea-"+newId)
      if(newItemInput)
        newItemInput.focus()
    }, 100);

    return newId;
  };

  // Helper to get node at a specific path
  const getNodeAtPath = (path) => {
    let current = listData;
    for (let i = 0; i < path.length; i++) {
      current = current.nested[path[i]];
    }
    return current;
  };

  // Helper to get path up to a certain index
  const getPathToIndex = (path, index) => {
    return path.slice(0, index + 1);
  };

  // Get the current root node based on rootPath
  const rootNode = rootPath.length > 0 ? getNodeAtPath(rootPath) : listData;

  return (
    <>
      {deleteItemData &&
        <ConfirmationBox
          message={deleteItemData.message}
          onConfirm={() => {
            deleteItem(deleteItemData.path);
            setDeleteItemData(null);
          }}
          onCancel={() => setDeleteItemData(null)}
        />}
      <div className="nested-list-container">
          <div className="current-path">
            <button 
              onClick={() => dispatch(setRootPath([]))}
              className="path-button"
            >
              Root
            </button>
            {rootPath.map((index, i) => {
              const node = getNodeAtPath(getPathToIndex(rootPath, i));
              return (
                <React.Fragment key={i}>
                  <span className="path-separator">&gt;</span>
                  <button 
                    onClick={() => dispatch(setRootPath(getPathToIndex(rootPath, i)))}
                    className="path-button"
                  >
                    {ellipsis(node.content, 10)}
                  </button>
                </React.Fragment>
              );
            })}
            {(copyListItemPath || cutListItemPath) && (
              <button 
                onClick={() => dispatch(clearClipboardPaths())}
                className="path-button clear-clipboard"
              >
                Clear Clipboard
              </button>
            )}
          </div>
          <div className="nested-list-container-scroll">
            {listData ? (
              <>
                <NestedListItem
                  key={rootNode.id}
                  item={rootNode}
                  index={0}
                  path={rootPath}
                  duplicateItem={duplicateItem}
                  addAfter={addAfter}
                  deleteItemButtonClick={deleteItemButtonClick}
                  toggleOpen={toggleOpen}
                  insertInto={insertInto}
                />
              </>
            ) : (
              <div className="empty-state">
                <ListsSelector
                  onSelectList={(id) => dispatch(setListID(id))}
                />
              </div>
            )}
          </div>
      </div>
    </>
  );
}

export default NestedList;