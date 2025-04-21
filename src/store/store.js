import { configureStore } from '@reduxjs/toolkit';
import mainReducer from './idsSlice';
import menuReducer from './menuSlice';
import listReducer from './listSlice';

export const store = configureStore({
  reducer: {
    main: mainReducer,
    menu: menuReducer,
    list: listReducer
  }
});
