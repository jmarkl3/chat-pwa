import React, { useState } from 'react';
import './NestedList.css';
import NestedListItem from './NestedListItem';
import { ellipsis } from '../../Global/functions';
import ListsSelector from '../../Components/Menus/ListsSelector';
import ConfirmationBox from '../../Components/ConfirmationBox';
import { useDispatch, useSelector } from 'react-redux';
import { setListID } from '../../store/idsSlice';
import "./JsonList.css"
import { setListData, setRootPath, clearClipboardPaths } from '../../store/listSlice';
import { createEmptyList, addIds, testData, deleteListItem } from './ListFunctions';

/*
  commands to add:
  update text content of an item
  open or close an item
  reorder things

  it seems it can rename things but it sometimes renames the wrong one
    it was just sending the wrong index for some reason
      maybe including the index in the object tha is sent will help it
      along with examples

      asking it to add items it adds to the wrong places
        like fruits under apple category
      it puts it in the wrong index simetimes too, added index to the text idk if it helped tho
      its note reliable
      says its diong this that it doesn't do

      maybe give it more examples
      and more detailed instructions
      and have this additional text available ony when a list is loaded
      and when a list is loaded the game listData maybe won't be loaded
      also the game listData could be more detailed but only show when a certain game is being played
        so this would need to be saed in a game name ref

*/

function NestedList() {
  
  const dispatch = useDispatch();
  const { selectedListID, listData, rootPath, copyListItemPath, cutListItemPath } = useSelector(state => state.list);

  // State for the nested list listData
  const [deleteItemData, setDeleteItemData] = useState(null);
  // State for tracking the current root path

  const deleteItemButtonClick = (itemData, path) => {
    // Check if confirmation is needed
    const needsConfirmation = itemData.content.length > 10 || (itemData.nested && itemData.nested.length > 0);
    
    if (needsConfirmation) {
      const preview = itemData.content.slice(0, 10) + (itemData.content.length > 10 ? '...' : '');
      const nestedCount = itemData.nested ? itemData.nested.length : 0;
      setDeleteItemData({
        path,
        message: `Delete item "${preview}" with ${nestedCount} nested items?`
      });
    } else {
      // If no confirmation needed, delete immediately
      deleteListItem(selectedListID, path, (updatedData) => {
        dispatch(setListData(updatedData));
      });
    }
  };

  // Helper to get node at a specific path
  const getNodeAtPath = (path) => {
    let current = listData;
    for (let i = 0; i < path.length; i++) {
      current = current.nested[path[i]];
    }
    return current;
  };

  // Helper to get path up to a certain index
  const getPathToIndex = (path, index) => {
    return path.slice(0, index + 1);
  };

  // Get the current root node based on rootPath
  const rootNode = rootPath.length > 0 ? getNodeAtPath(rootPath) : listData;

  return (
    <>
      {deleteItemData &&
        <ConfirmationBox
          message={deleteItemData.message}
          onConfirm={() => {
            deleteListItem(selectedListID, deleteItemData.path, (updatedData) => {
              dispatch(setListData(updatedData));
            });
            setDeleteItemData(null);
          }}
          onCancel={() => setDeleteItemData(null)}
        />}
      <div className="nested-list-container">
          <div className="current-path">
            <button 
              onClick={() => dispatch(setRootPath([]))}
              className="path-button"
            >
              Root
            </button>
            {rootPath.map((index, i) => {
              const node = getNodeAtPath(getPathToIndex(rootPath, i));
              return (
                <React.Fragment key={i}>
                  <span className="path-separator">&gt;</span>
                  <button 
                    onClick={() => dispatch(setRootPath(getPathToIndex(rootPath, i)))}
                    className="path-button"
                  >
                    {ellipsis(node.content, 10)}
                  </button>
                </React.Fragment>
              );
            })}
            {(copyListItemPath || cutListItemPath) && (
              <button 
                onClick={() => dispatch(clearClipboardPaths())}
                className="path-button clear-clipboard"
              >
                Clear Clipboard
              </button>
            )}
          </div>
          <div className="nested-list-container-scroll">
            {listData ? (
              <>
                <NestedListItem
                  key={rootNode.id}
                  item={rootNode}
                  index={0}
                  path={rootPath}
                  deleteItemButtonClick={deleteItemButtonClick}
                />
              </>
            ) : (
              <div className="empty-state">
                <ListsSelector
                  onSelectList={(id) => dispatch(setListID(id))}
                />
              </div>
            )}
          </div>
      </div>
    </>
  );
}

export default NestedList;