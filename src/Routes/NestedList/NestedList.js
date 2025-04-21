import React, { useState, useEffect } from 'react';
import './NestedList.css';
import NestedListItem from './NestedListItem';
import { ellipsis, generateId } from '../../Global/functions';
import ListsSelector from '../../Components/Menus/ListsSelector';
import ConfirmationBox from '../../Components/ConfirmationBox';
import { useDispatch, useSelector } from 'react-redux';
import { setListID } from '../../store/idsSlice';
import "./JsonList.css"
import { setListData, setRootPath, clearClipboardPaths } from '../../store/listSlice';
import { createEmptyList } from './ListFunctions';

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

  // Save listData whenever it changes
  useEffect(() => {
    if (selectedListID && listData) {
      // Save the full list listData
      localStorage.setItem(`note-list-${selectedListID}`, JSON.stringify(listData));

      // Update the lists index
      const listsStr = localStorage.getItem('note-lists') || '[]';
      const lists = JSON.parse(listsStr);
      const timestamp = Date.now();

      const updatedLists = lists.filter(l => l.id !== selectedListID);
      updatedLists.push({
        id: selectedListID,
        content: listData.content,
        timestamp: timestamp
      });

      // Sort by timestamp, most recent first
      updatedLists.sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem('note-lists', JSON.stringify(updatedLists));
    }
  }, [listData, selectedListID]);

  // Create a new list
  const createNewList = () => {
    const newList = createEmptyList();
    const newId = newList.id;

    // Save the new list listData
    localStorage.setItem(`note-list-${newId}`, JSON.stringify(newList));

    // Update the lists index
    const listsStr = localStorage.getItem('note-lists') || '[]';
    const lists = JSON.parse(listsStr);
    const timestamp = Date.now();

    lists.push({
      id: newId,
      content: newList.content,
      timestamp: timestamp
    });

    localStorage.setItem('note-lists', JSON.stringify(lists));

    // Set the new list as active
    dispatch(setListData(newList))
    dispatch(setListID(newId));
    dispatch(setRootPath([]))

    setTimeout(() => {
      let newItemInput = document.getElementById("textarea-"+newId)
      if(newItemInput)
        newItemInput.focus()
    }, 100);

    return newId;
  };

  // Add IDs to initial listData structure
  const addIds = (node) => {
    node.id = generateId();
    if (node.nested) {
      node.nested.forEach(child => addIds(child));
    }
    return node;
  };

  // Sample test listData with 3 layers of nesting and 12 total items
  const testData = addIds({
    content: "Root List",
    isOpen: true,
    nested: [
      {
        content: "First Level Item 1",
        isOpen: false,
        nested: [
          {
            content: "Second Level Item 1.1",
            isOpen: false,
            nested: [
              { content: "Third Level Item 1.1.1", isOpen: false, nested: [] },
              { content: "Third Level Item 1.1.2", isOpen: false, nested: [] }
            ]
          },
          { content: "Second Level Item 1.2", isOpen: false, nested: [] }
        ]
      },
      {
        content: "First Level Item 2",
        isOpen: false,
        nested: [
          { content: "Second Level Item 2.1", isOpen: false, nested: [] },
          { 
            content: "Second Level Item 2.2", 
            isOpen: false, 
            nested: [
              { content: "Third Level Item 2.2.1", isOpen: false, nested: [] }
            ] 
          }
        ]
      },
      {
        content: "First Level Item 3",
        isOpen: false,
        nested: [
          { content: "Second Level Item 3.1", isOpen: false, nested: [] },
          { content: "Second Level Item 3.2", isOpen: false, nested: [] },
          { content: "Second Level Item 3.3", isOpen: false, nested: [] }
        ]
      }
    ]
  }); 

  // Function to update nested list listData
  const updateNestedListData = (newContent, path) => {
    // Create a deep copy of the current listData
    const newData = JSON.parse(JSON.stringify(listData));
    
    // If path is empty, update root level
    if (path.length === 0) {
      dispatch(setListData({ ...newData, content: newContent }))
      return;
    }

    // Navigate to the target item using the path
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current.nested[path[i]];
    }

    // Update the target item's content
    const targetIndex = path[path.length - 1];
    current.nested[targetIndex].content = newContent;

    // Update the state with the new listData
    dispatch(setListData(newData))
  };

  // Function to move an item up or down in its current level
  const moveItem = (path, direction) => {
    console.log(`Moving item with path [${path.join(',')}] ${direction}`);
    
    // Create a deep copy of the current listData
    const newData = JSON.parse(JSON.stringify(listData));
    
    // If path is empty, we can't move the root
    if (path.length === 0) {
      console.log('Cannot move root item');
      return;
    }
    
    // Navigate to the parent that contains the item to move
    let parent = newData;
    for (let i = 0; i < path.length - 1; i++) {
      parent = parent.nested[path[i]];
    }
    console.log('Found parent:', parent.content);
    
    // Get the array of items at this level
    const items = parent.nested;
    const currentIndex = path[path.length - 1];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Check if move is possible
    if (newIndex < 0 || newIndex >= items.length) {
      console.log(`Cannot move ${direction}: index would be out of bounds`);
      return;
    }
    
    console.log(`Moving item from index ${currentIndex} to ${newIndex}`);
    console.log('Item being moved:', items[currentIndex].content);
    console.log('Swapping with:', items[newIndex].content);
    
    // Swap the items
    const temp = items[currentIndex];
    items[currentIndex] = items[newIndex];
    items[newIndex] = temp;
    console.log(newData)
    // Update the state with the new listData
    dispatch(setListData(newData))
  };

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

  // Function to set a new root path
  const setAsRoot = (path) => {
    console.log('Setting new root path:', path);
    dispatch(setRootPath([...path]))
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

  // Function to paste a copied or cut item after the specified path
  const pasteAfter = (targetPath) => {
    console.log(`Pasting item after path [${targetPath.join(',')}]`);
    
    // Create a deep copy of the current listData
    const newData = JSON.parse(JSON.stringify(listData));
    
    // If no item is copied or cut, do nothing
    if (!copyListItemPath && !cutListItemPath) {
      console.log('Nothing to paste');
      return;
    }
    
    // If target path is empty, we can't paste after root
    if (targetPath.length === 0) {
      console.log('Cannot paste after root item');
      return;
    }
    
    // Get the source path (either copy or cut)
    const sourcePath = copyListItemPath || cutListItemPath;
    
    // Get the source item
    let sourceParent = newData;
    for (let i = 0; i < sourcePath.length - 1; i++) {
      sourceParent = sourceParent.nested[sourcePath[i]];
    }
    const sourceIndex = sourcePath[sourcePath.length - 1];
    const sourceItem = JSON.parse(JSON.stringify(sourceParent.nested[sourceIndex]));
    
    // If we're cutting, we need to check if the target is a child of the source
    if (cutListItemPath) {
      // Check if target is a child of source
      const isTargetChildOfSource = targetPath.length > sourcePath.length && 
        JSON.stringify(targetPath.slice(0, sourcePath.length)) === JSON.stringify(sourcePath);
      
      if (isTargetChildOfSource) {
        console.log('Cannot paste: target is a child of the source');
        return;
      }
    }
    
    // Navigate to the target parent
    let targetParent = newData;
    for (let i = 0; i < targetPath.length - 1; i++) {
      targetParent = targetParent.nested[targetPath[i]];
    }
    const targetIndex = targetPath[targetPath.length - 1];
    
    // For a cut operation, we need to remove the original item first
    // But we need to adjust the target index if the source comes before the target in the same parent
    if (cutListItemPath) {
      // If source and target have the same parent
      const sameParent = sourcePath.length === targetPath.length && 
        JSON.stringify(sourcePath.slice(0, -1)) === JSON.stringify(targetPath.slice(0, -1));
      
      // Remove the source item
      sourceParent.nested.splice(sourceIndex, 1);
      
      // If source and target have the same parent and source comes before target,
      // we need to adjust the target index
      if (sameParent && sourceIndex < targetIndex) {
        // Insert at targetIndex - 1 because we removed an item before it
        targetParent.nested.splice(targetIndex, 0, sourceItem);
      } else {
        // Insert at targetIndex + 1 (after the target)
        targetParent.nested.splice(targetIndex + 1, 0, sourceItem);
      }
    } else {
      // For copy operation, we don't need to remove anything, just add a deep copy
      // Give the copied item and all its nested items new IDs
      addIds(sourceItem);
      
      // Insert the copy after the target
      targetParent.nested.splice(targetIndex + 1, 0, sourceItem);
    }
    
    // Update the state with the new listData
    dispatch(setListData(newData));
    
    // Clear the clipboard after a cut operation
    if (cutListItemPath) {
      dispatch(clearClipboardPaths());
    }
  };

  // Function to paste a copied or cut item into the specified path
  const pasteInto = (targetPath) => {
    console.log(`Pasting item into path [${targetPath.join(',')}]`);
    
    // Create a deep copy of the current listData
    const newData = JSON.parse(JSON.stringify(listData));
    
    // If no item is copied or cut, do nothing
    if (!copyListItemPath && !cutListItemPath) {
      console.log('Nothing to paste');
      return;
    }
    
    // Get the source path (either copy or cut)
    const sourcePath = copyListItemPath || cutListItemPath;
    
    // Get the source item
    let sourceParent = newData;
    for (let i = 0; i < sourcePath.length - 1; i++) {
      sourceParent = sourceParent.nested[sourcePath[i]];
    }
    const sourceIndex = sourcePath[sourcePath.length - 1];
    const sourceItem = JSON.parse(JSON.stringify(sourceParent.nested[sourceIndex]));
    
    // If we're cutting, we need to check if the target is a child of the source
    if (cutListItemPath) {
      // Check if target is the source or a child of source
      const isTargetSourceOrChild = 
        JSON.stringify(targetPath) === JSON.stringify(sourcePath) ||
        (targetPath.length > sourcePath.length && 
         JSON.stringify(targetPath.slice(0, sourcePath.length)) === JSON.stringify(sourcePath));
      
      if (isTargetSourceOrChild) {
        console.log('Cannot paste: target is the source or a child of the source');
        return;
      }
    }
    
    // Navigate to the target
    let target = newData;
    for (let i = 0; i < targetPath.length; i++) {
      target = target.nested[targetPath[i]];
    }
    
    // For a cut operation, we need to remove the original item first
    if (cutListItemPath) {
      // Remove the source item
      sourceParent.nested.splice(sourceIndex, 1);
    } else {
      // For copy operation, give the copied item and all its nested items new IDs
      addIds(sourceItem);
    }
    
    // Make sure the target is open to show the pasted item
    target.isOpen = true;
    
    // Add the item to the target's nested array
    target.nested.push(sourceItem);
    
    // Update the state with the new listData
    dispatch(setListData(newData));
    
    // Clear the clipboard after a cut operation
    if (cutListItemPath) {
      dispatch(clearClipboardPaths());
    }
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
                  updateContent={updateNestedListData}
                  moveItem={moveItem}
                  duplicateItem={duplicateItem}
                  addAfter={addAfter}
                  deleteItemButtonClick={deleteItemButtonClick}
                  setAsRoot={setAsRoot}
                  toggleOpen={toggleOpen}
                  insertInto={insertInto}
                  pasteAfter={pasteAfter}
                  pasteInto={pasteInto}
                />
              </>
            ) : (
              <div className="empty-state">
                <ListsSelector
                  onSelectList={(id) => dispatch(setListID(id))}
                  createNewList={createNewList}
                />
              </div>
            )}
          </div>
      </div>
    </>
  );
}

export default NestedList;