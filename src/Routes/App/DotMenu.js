import React, { useState, useRef, useEffect } from 'react';
import './DotMenu.css';

const DotMenu = ({ children }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [corner, setCorner] = useState(1);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const getClosestCorner = () => {
    if (!buttonRef.current) return 1;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    // Calculate distances to each corner
    const distToTopLeft = Math.sqrt(
      Math.pow(rect.left, 2) + 
      Math.pow(rect.top, 2)
    );
    const distToTopRight = Math.sqrt(
      Math.pow(windowWidth - rect.right, 2) + 
      Math.pow(rect.top, 2)
    );
    const distToBottomLeft = Math.sqrt(
      Math.pow(rect.left, 2) + 
      Math.pow(windowHeight - rect.bottom, 2)
    );
    const distToBottomRight = Math.sqrt(
      Math.pow(windowWidth - rect.right, 2) + 
      Math.pow(windowHeight - rect.bottom, 2)
    );

    // Find minimum distance
    const distances = [
      { corner: 1, dist: distToTopLeft },
      { corner: 2, dist: distToTopRight },
      { corner: 3, dist: distToBottomLeft },
      { corner: 4, dist: distToBottomRight }
    ];

    return distances.reduce((min, curr) => 
      curr.dist < min.dist ? curr : min
    ).corner;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && 
          menuRef.current && 
          !menuRef.current.contains(event.target) &&
          !buttonRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    if (showMenu) {
      setCorner(getClosestCorner());
    }
  }, [showMenu]);

  function optionClick(e){
    console.log("optionClick: ", optionClick)
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  return (
    <>
      <button 
        ref={buttonRef}
        className="menu-dots no-select" 
        onClick={optionClick}
        aria-label="Menu options"
      >
        ⋮
        {showMenu && (
          <div ref={menuRef} className={`message-menu corner-${corner}`} onClick={optionClick}>
            {children}
          </div>
        )}
      </button>
    </>
  );
};

export default DotMenu;
