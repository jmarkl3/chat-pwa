import { configureStore } from '@reduxjs/toolkit';
import mainReducer from './idsSlice';

export const store = configureStore({
  reducer: {
    main: mainReducer
  }
});
