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

  return (
    <div className="nested-list-container">
      <div className="header">
        <h2>{data.content}</h2>
      </div>
      
      <div className="nested-list">
        {data.nested.map((item, index) => (
          <NestedListItem
            key={index}
            item={item}
            index={index}
            path={[]}
          />
        ))}
      </div>
    </div>
  );
}

export default NestedList;