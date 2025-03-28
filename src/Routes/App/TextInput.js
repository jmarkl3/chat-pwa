import React, { useState, useEffect } from 'react';
import SlidePanel from './SlidePanel';
import './TextInput.css';

function TextInput({ title, refreshFunction, isOpen, setIsOpen, defaultValue, onChange, showRestoreDefault, onRestoreDefault, styles }) {
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
        <textarea
          className="text-input-area"
          value={value}
          onChange={handleChange}
        />
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
