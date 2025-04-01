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
    },
    newChat: (state) => {
      state.chatID = null;
    },
    deleteChat: (state, action) => {
      if (state.chatID === action.payload) {
        state.chatID = null;
      }
    },
    importChat: (state, action) => {
      const chatData = action.payload;
      state.chatID = chatData.id;
    }
  }
});

export const { setChatID, setListID, newChat, deleteChat, importChat } = mainSlice.actions;
export default mainSlice.reducer;
