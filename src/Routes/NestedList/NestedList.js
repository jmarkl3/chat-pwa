import React, { useState, useEffect } from 'react';
import './NestedList.css';
import NestedListItem from './NestedListItem';
import { ellipsis } from '../../Global/functions';
import NestedListMenu from './NestedListMenu';
import ListsSelector from '../../Components/Menus/ListsSelector';
import ConfirmationBox from '../../Components/ConfirmationBox';
import { useDispatch, useSelector } from 'react-redux';
import { setListID } from '../../store/idsSlice';

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
      and when a list is loaded the game data maybe won't be loaded
      also the game data could be more detailed but only show when a certain game is being played
        so this would need to be saed in a game name ref

*/
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
  
  const dispatch = useDispatch();
  const { listID, listUpdateTimestamp } = useSelector(state => state.main);

  // State for the nested list data
  const [data, setData] = useState(null);
  const [deleteItemData, setDeleteItemData] = useState(null);
  // State for tracking the current root path
  const [rootPath, setRootPath] = useState([]);

  // Load list data when listID changes or when list is updated externally
  useEffect(() => {
    if (listID) {
      const savedData = localStorage.getItem(`note-list-${listID}`);
      if (savedData) {
        setData(JSON.parse(savedData));
        setRootPath([]); // Reset root path when loading new list
      }
    }
  }, [listID, listUpdateTimestamp]);

  // Save data whenever it changes
  useEffect(() => {
    if (listID && data) {
      // Save the full list data
      localStorage.setItem(`note-list-${listID}`, JSON.stringify(data));

      // Update the lists index
      const listsStr = localStorage.getItem('note-lists') || '[]';
      const lists = JSON.parse(listsStr);
      const timestamp = Date.now();

      const updatedLists = lists.filter(l => l.id !== listID);
      updatedLists.push({
        id: listID,
        content: data.content,
        timestamp: timestamp
      });

      // Sort by timestamp, most recent first
      updatedLists.sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem('note-lists', JSON.stringify(updatedLists));
    }
  }, [data, listID]);

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
      timestamp: timestamp
    });

    localStorage.setItem('note-lists', JSON.stringify(lists));

    // Set the new list as active
    setData(newList);
    dispatch(setListID(newId));
    setRootPath([]);

    setTimeout(() => {
      let newItemInput = document.getElementById("textarea-"+newId)
      if(newItemInput)
        newItemInput.focus()
    }, 100);

    return newId;
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
    
    // Update the state with the new data
    setData(newData);

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
    
    // Update the state with the new data
    setData(newData);

    setTimeout(() => {
      let newItemInput = document.getElementById("textarea-"+newId)
      if(newItemInput)
        newItemInput.focus()
    }, 100);

    return newId;
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
          <div className="nested-list-container-scroll">
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
                  deleteItemButtonClick={deleteItemButtonClick}
                  setAsRoot={setAsRoot}
                  toggleOpen={toggleOpen}
                  insertInto={insertInto}
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