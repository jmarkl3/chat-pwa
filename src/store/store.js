import { configureStore } from '@reduxjs/toolkit';
import mainReducer from './idsSlice';
import menuReducer from './menuSlice';

export const store = configureStore({
  reducer: {
    main: mainReducer,
    menu: menuReducer
  }
});
