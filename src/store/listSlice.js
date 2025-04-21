import { createSlice } from '@reduxjs/toolkit';
import { act } from '@testing-library/react';
import { loadList } from '../Routes/NestedList/ListFunctions';

const initialState = {
  selectedListID: null,
  listData: null,
  rootPath: [],
  copyListItemPath: null, // The path of the node the user has started a copy action for
  cutListItemPath: null, // The path of the node the user has started a cut action for
};

export const listSlice = createSlice({
  name: 'list',
  initialState,
  reducers: {
    setSelectedListID: (state, action) => {
      state.selectedListID = action.payload;
      state.listData = loadList(action.payload)
    },
    setRootPath: (state, action) => {
      state.rootPath = action.payload;
    },
    setListData: (state, action) => {
      state.listData = action.payload;
    },

  }
});

export const { setSelectedListID, setRootPath, setListData, updateListTimestamp } = listSlice.actions;

export default listSlice.reducer;
