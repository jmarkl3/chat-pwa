import React, { useState } from 'react';
import './NestedList.css';
import NestedListItem from './NestedListItem';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

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
  nested: [
    {
      content: "First Level Item 1",
      nested: [
        {
          content: "Second Level Item 1.1",
          nested: [
            { content: "Third Level Item 1.1.1", nested: [] },
            { content: "Third Level Item 1.1.2", nested: [] }
          ]
        },
        { content: "Second Level Item 1.2", nested: [] }
      ]
    },
    {
      content: "First Level Item 2",
      nested: [
        { content: "Second Level Item 2.1", nested: [] },
        { 
          content: "Second Level Item 2.2", 
          nested: [
            { content: "Third Level Item 2.2.1", nested: [] }
          ] 
        }
      ]
    },
    {
      content: "First Level Item 3",
      nested: [
        { content: "Second Level Item 3.1", nested: [] },
        { content: "Second Level Item 3.2", nested: [] },
        { content: "Second Level Item 3.3", nested: [] }
      ]
    }
  ]
}); 

// Main NestedList component
function NestedList() {
  // State to hold the nested list data
  const [data, setData] = useState(testData);

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

  return (
    <div className="nested-list-container">
        <NestedListItem
          key={data.id}
          item={data}
          index={0}
          path={[]}
          updateContent={updateNestedListData}
          moveItem={moveItem}
          duplicateItem={duplicateItem}
          addAfter={addAfter}
          deleteItem={deleteItem}
        />
    </div>
  );
}

export default NestedList;