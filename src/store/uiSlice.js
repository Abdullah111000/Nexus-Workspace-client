import { createSlice } from '@reduxjs/toolkit';

const theme = localStorage.getItem('wm_theme') || 'dark';

const slice = createSlice({
  name: 'ui',
  initialState: {
    theme,
    sidebarOpen: true,
    commandOpen: false,
    offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    toastsUndo: [],
    undoStack: [],
    redoStack: [],
    selectedTaskIds: [],
    syncing: false,
    pendingQueue: JSON.parse(localStorage.getItem('wm_offline_queue') || '[]'),
  },
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload;
      localStorage.setItem('wm_theme', action.payload);
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebar(state, action) {
      state.sidebarOpen = action.payload;
    },
    setCommandOpen(state, action) {
      state.commandOpen = action.payload;
    },
    setOffline(state, action) {
      state.offline = action.payload;
    },
    pushUndo(state, action) {
      state.undoStack.push(action.payload);
      state.redoStack = [];
    },
    undo(state) {
      const last = state.undoStack.pop();
      if (last) state.redoStack.push(last);
    },
    redoPop(state) {
      const last = state.redoStack.pop();
      if (last) state.undoStack.push(last);
    },
    toggleSelected(state, action) {
      const id = action.payload;
      state.selectedTaskIds = state.selectedTaskIds.includes(id)
        ? state.selectedTaskIds.filter((x) => x !== id)
        : [...state.selectedTaskIds, id];
    },
    clearSelected(state) {
      state.selectedTaskIds = [];
    },
    setSelected(state, action) {
      state.selectedTaskIds = action.payload;
    },
    setSyncing(state, action) {
      state.syncing = action.payload;
    },
    enqueueOffline(state, action) {
      state.pendingQueue.push(action.payload);
      localStorage.setItem('wm_offline_queue', JSON.stringify(state.pendingQueue));
    },
    clearQueue(state) {
      state.pendingQueue = [];
      localStorage.setItem('wm_offline_queue', '[]');
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebar,
  setCommandOpen,
  setOffline,
  pushUndo,
  undo,
  redoPop,
  toggleSelected,
  clearSelected,
  setSelected,
  setSyncing,
  enqueueOffline,
  clearQueue,
} = slice.actions;

export default slice.reducer;
