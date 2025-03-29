import React, { useState, useEffect } from 'react';
import SlidePanel from '../App/SlidePanel';
import './NestedListMenu.css';
import ListsSelector from './ListsSelector';

function NestedListsWindow({isOpen, setIsOpen, onSelectList}) {

  return (    
    <SlidePanel isOpen={isOpen} setIsOpen={setIsOpen}>
      <ListsSelector
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onSelectList={onSelectList}
      />
    </SlidePanel>
  );
}

export default NestedListsWindow;