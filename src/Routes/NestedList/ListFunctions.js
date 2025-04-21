/*
    The list data is in local storage: titles: "note-lists" and list data: `note-list-${listID}` 
    localStorage.getItem(`note-lists`)
    localStorage.getItem(`note-list-${listID}`)

    nested list data structure shown with testData

    list titles in local storage is an array with objects, each has content id and timestamp attributes
    [
      {
        content": "beverages a",
        id: "zl0ei6snj",
        timestamp: 1745252068056,
      },
    ]

*/

import { generateId } from "../../Global/functions";

/**
 * Add IDs to a nested list data structure
 * @param {Object} node - The node to add IDs to
 * @returns {Object} The node with IDs added
 */
export function addIds(node) {
  node.id = generateId();
  if (node.nested) {
    node.nested.forEach(child => addIds(child));
  }
  return node;
}

/**
 * Sample test data with 3 layers of nesting and 12 total items
 */
export const testData = addIds({
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
})

export function loadLists() {
  const lists = localStorage.getItem('note-lists');
  return lists ? JSON.parse(lists) : [];
}

// Loads a specific list's data from localStorage
export function loadList(listID) {
  const listData = localStorage.getItem(`note-list-${listID}`);
  return listData ? JSON.parse(listData) : null;
}

// Lists

/**
 * Moves a list item from one path to another
 * @param {string} listID - The ID of the list
 * @param {Array} sourcePath - The current path of the item to move
 * @param {Array} targetPath - The target path where the item should be moved
 * @param {Function} onDataUpdated - Callback function that will be called with the updated list data
 * @returns {Object} The updated list data
 */
export function moveListItem(listID, sourcePath, targetPath, onDataUpdated) {
  console.log(`Moving item from path [${sourcePath.join(',')}] to [${targetPath.join(',')}]`);
  
  // Load and create a deep copy of the current list data
  const listData = loadList(listID);
  if (!listData) {
    console.log('List data not found');
    return null;
  }
  
  const newData = JSON.parse(JSON.stringify(listData));
  
  // If either path is empty (root node), we can't move
  if (sourcePath.length === 0) {
    console.log('Cannot move root item');
    return newData;
  }
  
  // Navigate to the source parent
  let sourceParent = newData;
  for (let i = 0; i < sourcePath.length - 1; i++) {
    sourceParent = sourceParent.nested[sourcePath[i]];
  }
  
  // Get the source item and its index
  const sourceIndex = sourcePath[sourcePath.length - 1];
  if (sourceIndex < 0 || sourceIndex >= sourceParent.nested.length) {
    console.log('Source index out of bounds');
    return newData;
  }
  
  // Get a copy of the source item
  const sourceItem = JSON.parse(JSON.stringify(sourceParent.nested[sourceIndex]));
  
  // Handle special case: moving within the same parent array
  if (sourcePath.length === targetPath.length && 
      sourcePath.slice(0, -1).every((val, idx) => val === targetPath[idx])) {
    
    const targetIndex = targetPath[targetPath.length - 1];
    
    // Validate target index
    if (targetIndex < 0 || targetIndex >= sourceParent.nested.length) {
      console.log('Target index out of bounds');
      return newData;
    }
    
    // Remove the item from its original position
    sourceParent.nested.splice(sourceIndex, 1);
    
    // Insert it at the target position
    sourceParent.nested.splice(targetIndex, 0, sourceItem);
    
    console.log(`Moved item within same parent from index ${sourceIndex} to ${targetIndex}`);
  } 
  // Handle moving to a different parent
  else {
    // Check if target path is valid
    if (targetPath.length === 0) {
      console.log('Cannot move to root');
      return newData;
    }
    
    // Check if target is a child of source (can't move parent into its own child)
    const isTargetChildOfSource = 
      targetPath.length > sourcePath.length && 
      sourcePath.every((val, idx) => val === targetPath[idx]);
    
    if (isTargetChildOfSource) {
      console.log('Cannot move item into its own child');
      return newData;
    }
    
    // Navigate to the target parent
    let targetParent = newData;
    for (let i = 0; i < targetPath.length - 1; i++) {
      targetParent = targetParent.nested[targetPath[i]];
    }
    
    // Get the target index
    const targetIndex = targetPath[targetPath.length - 1];
    
    // Validate target parent and index
    if (!targetParent.nested || targetIndex < 0 || targetIndex > targetParent.nested.length) {
      console.log('Target parent or index is invalid');
      return newData;
    }
    
    // Remove the item from its original position
    sourceParent.nested.splice(sourceIndex, 1);
    
    // Insert it at the target position
    targetParent.nested.splice(targetIndex, 0, sourceItem);
    
    console.log(`Moved item from one parent to another at index ${targetIndex}`);
  }
  
  // Save the updated data to localStorage
  saveListData(listID, newData);
  
  // Call the callback with the updated data if provided
  if (typeof onDataUpdated === 'function') {
    onDataUpdated(newData);
  }
  
  return newData;
}

/**
 * Helper function to move an item up in its current level
 * @param {string} listID - The ID of the list
 * @param {Array} path - The path of the item to move
 * @param {Function} onDataUpdated - Callback function that will be called with the updated list data
 * @returns {Object} The updated list data
 */
export function moveListItemUp(listID, path, onDataUpdated) {
  if (path.length === 0) {
    console.log('Cannot move root item');
    return null;
  }
  
  const currentIndex = path[path.length - 1];
  
  // If already at the top, can't move up further
  if (currentIndex === 0) {
    console.log('Item already at the top');
    return loadList(listID);
  }
  
  // Create new path with index decreased by 1
  const targetPath = [
    ...path.slice(0, -1),
    currentIndex - 1
  ];
  
  return moveListItem(listID, path, targetPath, onDataUpdated);
}

/**
 * Helper function to move an item down in its current level
 * @param {string} listID - The ID of the list
 * @param {Array} path - The path of the item to move
 * @param {Function} onDataUpdated - Callback function that will be called with the updated list data
 * @returns {Object} The updated list data
 */
export function moveListItemDown(listID, path, onDataUpdated) {
  if (path.length === 0) {
    console.log('Cannot move root item');
    return null;
  }
  
  // Load the list data to check the length of the parent's nested array
  const listData = loadList(listID);
  if (!listData) return null;
  
  // Navigate to the parent
  let parent = listData;
  for (let i = 0; i < path.length - 1; i++) {
    parent = parent.nested[path[i]];
  }
  
  const currentIndex = path[path.length - 1];
  
  // If already at the bottom, can't move down further
  if (currentIndex >= parent.nested.length - 1) {
    console.log('Item already at the bottom');
    return listData;
  }
  
  // Create new path with index increased by 1
  const targetPath = [
    ...path.slice(0, -1),
    currentIndex + 1
  ];
  
  return moveListItem(listID, path, targetPath, onDataUpdated);
}

/**
 * Updates the content of a list item at the specified path
 * @param {string} listID - The ID of the list
 * @param {Array} path - The path to the item to update
 * @param {string} newContent - The new content for the item
 * @param {Function} onDataUpdated - Callback function that will be called with the updated list data
 * @returns {Object} The updated list data
 */
export function updateListItemContent(listID, path, newContent, onDataUpdated) {
  console.log(`Updating content for item at path [${path.join(',')}]`);
  
  // Load and create a deep copy of the current list data
  const listData = loadList(listID);
  if (!listData) {
    console.log('List data not found');
    return null;
  }
  
  const newData = JSON.parse(JSON.stringify(listData));
  
  // If path is empty, update the root level content
  if (path.length === 0) {
    newData.content = newContent;
    console.log('Updated root item content');
  } else {
    // Navigate to the target item using the path
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current.nested[path[i]];
    }
    
    // Update the target item's content
    const targetIndex = path[path.length - 1];
    if (targetIndex < 0 || targetIndex >= current.nested.length) {
      console.log('Target index out of bounds');
      return newData;
    }
    
    current.nested[targetIndex].content = newContent;
    console.log(`Updated content for item at index ${targetIndex}`);
  }
  
  // Save the updated data to localStorage
  saveListData(listID, newData);
  
  // Update the list timestamp to indicate it was modified
  updateListTimestamp(listID);
  
  // Call the callback with the updated data if provided
  if (typeof onDataUpdated === 'function') {
    onDataUpdated(newData);
  }
  
  return newData;
}

/**
 * Updates the timestamp of a list to mark it as recently modified
 * @param {string} listID - The ID of the list to update
 */
export function updateListTimestamp(listID) {
  const lists = getLists();
  const listIndex = lists.findIndex(list => list.id === listID);
  
  if (listIndex !== -1) {
    lists[listIndex].timestamp = Date.now();
    saveLists(lists);
  }
}

/**
 * Creates a new empty list and saves it to localStorage
 * @param {Function} onListCreated - Optional callback function that will be called with the new list ID and data
 * @returns {string} The ID of the newly created list
 */
export function createNewList(onListCreated) {
  // Create a new empty list
  const newList = createEmptyList();
  const newId = newList.id;

  // Save the new list data
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

  // Sort by timestamp, most recent first
  lists.sort((a, b) => b.timestamp - a.timestamp);
  localStorage.setItem('note-lists', JSON.stringify(lists));

  // Call the callback with the new list ID and data if provided
  if (typeof onListCreated === 'function') {
    onListCreated(newId, newList);
  }

  return newId;
}

// Helper funcitons
  export function listItemIdToPath(listID, itemID) {
    const data = getListData(listID);
    if (!data) return null;
    
    function findPath(node, currentPath) {
      for (let i = 0; i < node.nested.length; i++) {
        const child = node.nested[i];
        if (child.id === itemID) {
          return [...currentPath, i];
        }
        
        const foundPath = findPath(child, [...currentPath, i]);
        if (foundPath) return foundPath;
      }
      return null;
    }
    
    return findPath(data, []);
  }
  function getLists() {
    return JSON.parse(localStorage.getItem('note-lists') || '[]');
  }
  
  function saveLists(lists) {
    localStorage.setItem('note-lists', JSON.stringify(lists));
  }
  
  export function getListData(listID) {
    return JSON.parse(localStorage.getItem(`note-list-${listID}`));
  }
  
  export function saveListData(listID, data) {
    localStorage.setItem(`note-list-${listID}`, JSON.stringify(data));
  }
  

  // Empty list template
export const createEmptyList = () => ({
  id: generateId(),
  content: "New List",
  isOpen: true,
  nested: []
});

/**
 * Pastes a copied or cut item after the specified path
 * @param {string} listID - The ID of the list to modify
 * @param {Array} targetPath - The path where to paste after
 * @param {Array} copyListItemPath - Path of the copied item (null if not copying)
 * @param {Array} cutListItemPath - Path of the cut item (null if not cutting)
 * @param {Function} onDataUpdated - Callback function to handle updated data
 * @param {Function} onClipboardCleared - Callback function to clear clipboard paths
 * @returns {Object} The updated list data
 */
export function pasteAfter(listID, targetPath, copyListItemPath, cutListItemPath, onDataUpdated, onClipboardCleared) {
  console.log(`Pasting item after path [${targetPath.join(',')}]`);
  
  // Load and create a deep copy of the current list data
  const listData = loadList(listID);
  const newData = JSON.parse(JSON.stringify(listData));
  
  // If no item is copied or cut, do nothing
  if (!copyListItemPath && !cutListItemPath) {
    console.log('Nothing to paste');
    return newData;
  }
  
  // If target path is empty, we can't paste after root
  if (targetPath.length === 0) {
    console.log('Cannot paste after root item');
    return newData;
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
      return newData;
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
  
  // Save the updated data to localStorage
  saveListData(listID, newData);
  
  // Update the list timestamp
  updateListTimestamp(listID);
  
  // Call the callback with the updated data
  if (onDataUpdated) {
    onDataUpdated(newData);
  }
  
  // Clear the clipboard after a cut operation
  if (cutListItemPath && onClipboardCleared) {
    onClipboardCleared();
  }
  
  return newData;
}

/**
 * Pastes a copied or cut item into the specified path
 * @param {string} listID - The ID of the list to modify
 * @param {Array} targetPath - The path where to paste into
 * @param {Array} copyListItemPath - Path of the copied item (null if not copying)
 * @param {Array} cutListItemPath - Path of the cut item (null if not cutting)
 * @param {Function} onDataUpdated - Callback function to handle updated data
 * @param {Function} onClipboardCleared - Callback function to clear clipboard paths
 * @returns {Object} The updated list data
 */
export function pasteInto(listID, targetPath, copyListItemPath, cutListItemPath, onDataUpdated, onClipboardCleared) {
  console.log(`Pasting item into path [${targetPath.join(',')}]`);
  
  // Load and create a deep copy of the current list data
  const listData = loadList(listID);
  const newData = JSON.parse(JSON.stringify(listData));
  
  // If no item is copied or cut, do nothing
  if (!copyListItemPath && !cutListItemPath) {
    console.log('Nothing to paste');
    return newData;
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
      return newData;
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
  
  // Save the updated data to localStorage
  saveListData(listID, newData);
  
  // Update the list timestamp
  updateListTimestamp(listID);
  
  // Call the callback with the updated data
  if (onDataUpdated) {
    onDataUpdated(newData);
  }
  
  // Clear the clipboard after a cut operation
  if (cutListItemPath && onClipboardCleared) {
    onClipboardCleared();
  }
  
  return newData;
}
