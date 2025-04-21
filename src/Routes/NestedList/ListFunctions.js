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

const testData = {
    content: "Root List",
    isOpen: true,
    nested: [
      {
        content: "First Level Item 1",
        id: "<unique item id>",
        isOpen: false,
        nested: [
          {
            content: "Second Level Item 1.1",
            isOpen: false,
            nested: [
              { content: "Third Level Item 1.1.1", isOpen: false, id: "<unique item id>", nested: [] },
              { content: "Third Level Item 1.1.2", isOpen: false, id: "<unique item id>", nested: [] }
            ]
          },
          { content: "Second Level Item 1.2", isOpen: false, id: "<unique item id>", nested: [] }
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
  }

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
export function deleteList(listID, updateListsCallback = ()=>{}) {
  // Remove from titles list
  const lists = getLists().filter(list => list.id !== listID);
  saveLists(lists);
  
  // Remove list data
  localStorage.removeItem(`note-list-${listID}`);

  updateListsCallback(lists)
}

export function duplicateList(listID, newName, updateListsCallback = ()=>{}) {
  const lists = getLists();
  const originalList = lists.find(list => list.id === listID);
  if (!originalList) return;
  
  // Create new list entry
  const newList = {
    content: newName,
    id: generateId(),
    timestamp: Date.now()
  };
  
  // Get and duplicate the list data
  const originalData = getListData(listID);
  const newData = JSON.parse(JSON.stringify(originalData));
  newData.content = newName;
  
  // Save both
  lists.push(newList);
  saveLists(lists);
  saveListData(newList.id, newData);
  
  updateListsCallback(lists)

  return newList.id;
}

// LIst Items
export function addItem(listID, targetPath, content, insert = 'append') {
  const data = getListData(listID);
  if (!data) return false;
  
  const newItem = {
    content,
    id: generateId(),
    isOpen: false,
    nested: []
  };
  
  let current = data;
  for (let i = 0; i < targetPath.length; i++) {
    current = current.nested[targetPath[i]];
  }
  
  if (insert === 'append') {
    current.nested.push(newItem);
  } else if (insert === 'prepend') {
    current.nested.unshift(newItem);
  } else if (typeof insert === 'number') {
    current.nested.splice(insert, 0, newItem);
  }
  
  saveListData(listID, data);
  return true;
}

export function deleteListItem(listID, targetPath) {
  const data = getListData(listID);
  if (!data || targetPath.length === 0) return false;
  
  const parentPath = targetPath.slice(0, -1);
  const indexToDelete = targetPath[targetPath.length - 1];
  
  let parent = data;
  for (const index of parentPath) {
    parent = parent.nested[index];
  }
  
  parent.nested.splice(indexToDelete, 1);
  saveListData(listID, data);
  return true;
}

export function moveListItem(listID, currentPath, newPath) {
  if (currentPath.join(',') === newPath.join(',')) return false;
  
  const data = getListData(listID);
  if (!data) return false;
  
  // Deep clone the data to work with
  const workingData = JSON.parse(JSON.stringify(data));
  
  // Navigate to the item to move
  let itemToMove = workingData;
  for (const index of currentPath) {
    itemToMove = itemToMove.nested[index];
  }
  
  // Navigate to the parent of the item to move
  let currentParent = workingData;
  for (let i = 0; i < currentPath.length - 1; i++) {
    currentParent = currentParent.nested[currentPath[i]];
  }
  const currentIndex = currentPath[currentPath.length - 1];
  
  // Remove the item from its current position
  const [removedItem] = currentParent.nested.splice(currentIndex, 1);
  
  // Navigate to the new parent
  let newParent = workingData;
  for (let i = 0; i < newPath.length - 1; i++) {
    newParent = newParent.nested[newPath[i]];
  }
  const newIndex = newPath[newPath.length - 1];
  
  // Insert the item at its new position
  newParent.nested.splice(newIndex, 0, removedItem);
  
  // Save the modified data
  saveListData(listID, workingData);
  return true;
}

export function moveListItemUp(listID, currentPath) {
  console.log("moveListItemUp", listID, currentPath);
  const data = getListData(listID);
  
  // Check if data exists and path is valid (not empty)
  if (!data || currentPath.length === 0) {
    console.log("Invalid list ID or empty path");
    return false;
  }
  
  const currentIndex = currentPath[currentPath.length - 1];
  
  // If already at the top (index 0), can't move up further
  if (currentIndex === 0) {
    console.log("Item already at the top of its parent's nested array");
    return false;
  }
  
  // Create new path with index decreased by 1
  const newPath = [
    ...currentPath.slice(0, -1), // All path elements except the last
    currentIndex - 1            // Decreased index
  ];
  
  console.log("Moving from", currentPath, "to", newPath);
  return moveListItem(listID, currentPath, newPath);
}

export function moveListItemDown(listID, currentPath) {
  const data = getListData(listID);
  if (!data || currentPath.length === 0) return false;


  // return moveListItem(listID, currentPath, newPath);
}

export function updateListTimestamp(listID) {
  const lists = getLists();
  const listIndex = lists.findIndex(list => list.id === listID);
  if (listIndex !== -1) {
    lists[listIndex].timestamp = Date.now();
    saveLists(lists);
  }
}

export function updateListItem(listID, targetPath, newContent) {
  const data = getListData(listID);
  if (!data || targetPath.length === 0) return false;
  
  let current = data;
  for (const index of targetPath) {
    current = current.nested[index];
  }
  
  current.content = newContent;
  saveListData(listID, data);
  updateListTimestamp(listID);
  return true;
}

export function appendToListItem(listID, targetPath, newContent) {
  const data = getListData(listID);
  if (!data) return false;
  
  let current = data;
  for (const index of targetPath) {
    current = current.nested[index];
  }
  
  current.content += newContent;
  saveListData(listID, data);
  return true;
}

export function openListItem(listID, path, open = true) {
  const data = getListData(listID);
  if (!data) return false;
  
  let current = data;
  for (const index of path) {
    current = current.nested[index];
  }
  
  current.isOpen = open;
  saveListData(listID, data);
  return true;
}

export function openAllListItems(listID, open = true) {
  const data = getListData(listID);
  if (!data) return false;
  
  function setOpenState(node) {
    node.isOpen = open;
    node.nested.forEach(setOpenState);
  }
  
  setOpenState(data);
  saveListData(listID, data);
  return true;
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
  
  function getListData(listID) {
    return JSON.parse(localStorage.getItem(`note-list-${listID}`));
  }
  
  function saveListData(listID, data) {
    localStorage.setItem(`note-list-${listID}`, JSON.stringify(data));
  }
  
  function generateId() {
    return Math.random().toString(36).substring(2, 10);
  }