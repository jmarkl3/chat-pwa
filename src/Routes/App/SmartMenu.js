import React, { useState, useEffect, useRef } from 'react';
import './SmartMenu.css';

function SmartMenu({ isOpen, onClose, children, buttonRef }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    if (isOpen && buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      
      // For bottom-left button, always open up and to the right
      let top = buttonRect.top - menuRect.height;
      let left = buttonRect.left;

      // Ensure menu stays within viewport
      if (top < 0) top = 0;
      if (left + menuRect.width > window.innerWidth) {
        left = window.innerWidth - menuRect.width;
      }

      setPosition({ top, left });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && 
          menuRef.current && 
          !menuRef.current.contains(event.target) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="smart-menu"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      {children}
    </div>
  );
}

export default SmartMenu;
