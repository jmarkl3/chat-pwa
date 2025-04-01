import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chatID: null,
  listID: null
};

export const mainSlice = createSlice({
  name: 'main',
  initialState,
  reducers: {
    setChatID: (state, action) => {
      state.chatID = action.payload;
    },
    setListID: (state, action) => {
      state.listID = action.payload;
    }
  }
});

export const { setChatID, setListID } = mainSlice.actions;

export default mainSlice.reducer;
