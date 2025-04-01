import React, { useState, useEffect } from 'react';
import SlidePanel from './SlidePanel';
import './TextInput.css';

function TextInput({ title, refreshFunction, isOpen, setIsOpen, defaultValue, onChange, showRestoreDefault, onRestoreDefault, styles, type }) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleChange = (e) => {
    setValue(e.target.value);
    onChange(e.target.value);
  };

  const handleRestoreDefault = () => {
    onRestoreDefault();
  };

  const formatJSON = (jsonString) => {
    try {
      if (typeof jsonString === 'string') {
        return JSON.stringify(JSON.parse(jsonString), null, 2);
      }
      return JSON.stringify(jsonString, null, 2);
    } catch (e) {
      return jsonString;
    }
  };

  return (
    <SlidePanel title={title} isOpen={isOpen} setIsOpen={setIsOpen} styles={styles}>
      {refreshFunction !== undefined && (
        <button 
          style={{ position: 'absolute', top: '5px', left: '5px', zIndex: 2 }}
          onClick={refreshFunction}
          title="Refresh from storage"
        >
          🔄
        </button>
      )}
      <div className="text-input-wrapper">
        {type === 'json' ? (
          <pre className="json-display">
            {formatJSON(value)}
          </pre>
        ) : (
          <textarea
            className="text-input-area"
            value={value}
            onChange={handleChange}
          />
        )}
        {showRestoreDefault && (
          <button className="restore-default-button" onClick={handleRestoreDefault}>
            Restore Default
          </button>
        )}
      </div>
    </SlidePanel>
  );
}

export default TextInput;
