import React, { useState, useEffect } from 'react';
import './NestedList.css';
import NestedListItem from './NestedListItem';
import { ellipsis } from '../App/functions';
import NestedListMenu from './NestedListMenu';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Empty list template
const createEmptyList = () => ({
  id: generateId(),
  content: "New List",
  isOpen: true,
  nested: []
});

function NestedList() {
  
  const [listId, setListId] = useState();
  // State for the nested list data
  const [data, setData] = useState(null);
  // State for tracking the current root path
  const [rootPath, setRootPath] = useState([]);

  // Load list data when listId changes
  useEffect(() => {
    if (listId) {
      const savedData = localStorage.getItem(`note-list-${listId}`);
      if (savedData) {
        setData(JSON.parse(savedData));
        setRootPath([]); // Reset root path when loading new list
      }
    }
  }, [listId]);

  // Save data whenever it changes
  useEffect(() => {
    if (listId && data) {
      // Save the full list data
      localStorage.setItem(`note-list-${listId}`, JSON.stringify(data));

      // Update the lists index
      const listsStr = localStorage.getItem('note-lists') || '[]';
      const lists = JSON.parse(listsStr);
      const timestamp = Date.now();

      const updatedLists = lists.filter(l => l.id !== listId);
      updatedLists.push({
        id: listId,
        content: data.content,
        lastModified: timestamp
      });

      // Sort by last modified, most recent first
      updatedLists.sort((a, b) => b.lastModified - a.lastModified);
      localStorage.setItem('note-lists', JSON.stringify(updatedLists));
    }
  }, [data, listId]);

  // Create a new list
  const createNewList = () => {
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
      lastModified: timestamp
    });

    localStorage.setItem('note-lists', JSON.stringify(lists));

    // Set the new list as active
    setData(newList);
    setListId(newId);
    setRootPath([]);
  };

  // Add IDs to initial data structure
  const addIds = (node) => {
    node.id = generateId();
    if (node.nested) {
      node.nested.forEach(child => addIds(child));
    }
    return node;
  };

  // Sample test data with 3 layers of nesting and 12 total items
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

  // Function to update nested list data
  const updateNestedListData = (newContent, path) => {
    // Create a deep copy of the current data
    const newData = JSON.parse(JSON.stringify(data));
    
    // If path is empty, update root level
    if (path.length === 0) {
      setData({ ...newData, content: newContent });
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

    // Update the state with the new data
    setData(newData);
  };

  // Function to move an item up or down in its current level
  const moveItem = (path, direction) => {
    console.log(`Moving item with path [${path.join(',')}] ${direction}`);
    
    // Create a deep copy of the current data
    const newData = JSON.parse(JSON.stringify(data));
    
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
    // Update the state with the new data
    setData(newData);
  };

  // Function to duplicate a node and insert it after the original
  const duplicateItem = (path) => {
    console.log(`Duplicating item at path [${path.join(',')}]`);
    
    // Create a deep copy of the current data
    const newData = JSON.parse(JSON.stringify(data));
    
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
    
    // Update the state with the new data
    setData(newData);
  };

  // Function to add an empty node after the specified path
  const addAfter = (path) => {
    console.log(`Adding empty node after path [${path.join(',')}]`);
    
    // Create a deep copy of the current data
    const newData = JSON.parse(JSON.stringify(data));
    
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
    const emptyNode = {
      id: generateId(),
      content: "New Item",
      isOpen: false,
      nested: []
    };
    console.log('Adding empty node after index:', currentIndex);
    
    // Insert the empty node after the current item
    items.splice(currentIndex + 1, 0, emptyNode);
    console.log('New array length:', items.length);
    
    // Update the state with the new data
    setData(newData);
  };

  // Function to delete a node at the specified path
  const deleteItem = (path) => {
    console.log(`Deleting item at path [${path.join(',')}]`);
    
    // Create a deep copy of the current data
    const newData = JSON.parse(JSON.stringify(data));
    
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
    
    // Update the state with the new data
    setData(newData);
  };

  // Function to set a new root path
  const setAsRoot = (path) => {
    console.log('Setting new root path:', path);
    setRootPath([...path]);
  };

  // Function to toggle open/closed state
  const toggleOpen = (path) => {
    console.log('Toggling open state at path:', path);
    
    // Create a deep copy of the current data
    const newData = JSON.parse(JSON.stringify(data));
    
    // Navigate to the target node
    let current = newData;
    for (let i = 0; i < path.length; i++) {
      current = current.nested[path[i]];
    }
    
    // Toggle the isOpen state
    current.isOpen = !current.isOpen;
    console.log('New isOpen state:', current.isOpen);
    
    // Update the state with the new data
    setData(newData);
  };

  // Function to insert a new item inside a node's nested list
  const insertInto = (path) => {
    console.log('Inserting new item into path:', path);
    
    // Create a deep copy of the current data
    const newData = JSON.parse(JSON.stringify(data));
    
    // Navigate to the target node
    let current = newData;
    for (let i = 0; i < path.length; i++) {
      current = current.nested[path[i]];
    }
    
    // Create empty node with same structure
    const emptyNode = {
      id: generateId(),
      content: "New Item",
      isOpen: false,
      nested: []
    };
    
    // Add the new item to the nested array
    current.nested.push(emptyNode);
    console.log('Added new item to nested array');
    
    // Make sure the parent is open to show the new item
    current.isOpen = true;
    console.log('Opened parent node');
    
    // Update the state with the new data
    setData(newData);
  };

  // Helper to get node at a specific path
  const getNodeAtPath = (path) => {
    let current = data;
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
  const rootNode = rootPath.length > 0 ? getNodeAtPath(rootPath) : data;

  return (
    <div className="nested-list-container">
        <div className="current-path">
          <button 
            onClick={() => setRootPath([])}
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
                  onClick={() => setRootPath(getPathToIndex(rootPath, i))}
                  className="path-button"
                >
                  {ellipsis(node.content, 10)}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        {data ? (
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
              deleteItem={deleteItem}
              setAsRoot={setAsRoot}
              toggleOpen={toggleOpen}
              insertInto={insertInto}
            />
            <NestedListMenu 
              createNewList={createNewList}
              onSelectList={setListId}
            />
          </>
        ) : (
          <div className="empty-state">
            <button onClick={createNewList}>Create New List</button>
          </div>
        )}
    </div>
  );
}

export default NestedList;