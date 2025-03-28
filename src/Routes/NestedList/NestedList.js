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

  return (
    <div className="nested-list-container">
        <NestedListItem
          key={"root"}
          item={data}
          index={0}
          path={[]}
          updateContent={updateNestedListData}
        />
    </div>
  );
}

export default NestedList;