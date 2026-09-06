import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import ui from './uiSlice';
import data from './dataSlice';

export const store = configureStore({
  reducer: { auth, ui, data },
});
