import React, { useState, useEffect } from 'react';
import './NestedListMenu.css';
import SlidePanel from '../../Components/SlidePanel';
import ListsSelector from '../../Components/Menus/ListsSelector';

function NestedListsWindow({isOpen, setIsOpen}) {

  return (    
    <SlidePanel isOpen={isOpen} setIsOpen={setIsOpen}>
      <ListsSelector
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </SlidePanel>
  );
}

export default NestedListsWindow;