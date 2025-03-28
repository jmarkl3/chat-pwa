import React, { useState } from 'react';
import './NestedList.css';
import NestedListItem from './NestedListItem';

// Sample test data with 3 layers of nesting and 12 total items
const testData = {
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
}; 

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

  return (
    <div className="nested-list-container">
        <NestedListItem
          key={"root"}
          item={data}
          index={0}
          path={[]}
          updateContent={updateNestedListData}
          moveItem={moveItem}
        />
    </div>
  );
}

export default NestedList;