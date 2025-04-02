import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chatID: null,
  listID: null,
  listUpdateTimestamp: null,
};

export const idsSlice = createSlice({
  name: 'main',
  initialState,
  reducers: {
    setChatID: (state, action) => {
      state.chatID = action.payload;
    },
    setListID: (state, action) => {
      state.listID = action.payload;
    },
    updateListTimestamp: (state) => {
      state.listUpdateTimestamp = Date.now();
    }
  }
});

export const { setChatID, setListID, updateListTimestamp } = idsSlice.actions;

export default idsSlice.reducer;
