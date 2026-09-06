import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../lib/api.js';

export const loadWorkspaces = createAsyncThunk('data/workspaces', async () => {
  const { data } = await api.get('/workspaces');
  return data;
});

export const loadWorkspace = createAsyncThunk('data/workspace', async (id) => {
  const { data } = await api.get(`/workspaces/${id}`);
  return data;
});

export const loadProjects = createAsyncThunk('data/projects', async (workspaceId) => {
  const { data } = await api.get(`/projects/workspace/${workspaceId}`);
  return data;
});

export const loadTasks = createAsyncThunk('data/tasks', async ({ projectId, params }) => {
  const { data } = await api.get(`/tasks/project/${projectId}`, { params });
  return data;
});

export const loadNotifications = createAsyncThunk('data/notifs', async () => {
  const { data } = await api.get('/notifications');
  return data;
});

export const loadDirectory = createAsyncThunk('data/dir', async () => {
  const { data } = await api.get('/users/directory');
  return data;
});

const slice = createSlice({
  name: 'data',
  initialState: {
    workspaces: [],
    current: null,
    projects: [],
    tasks: [],
    subtasks: [],
    notifications: { items: [], unread: 0 },
    directory: [],
    loading: false,
  },
  reducers: {
    upsertTask(state, action) {
      const t = action.payload;
      const i = state.tasks.findIndex((x) => x._id === t._id);
      if (i >= 0) state.tasks[i] = t;
      else if (!t.parent) state.tasks.push(t);
    },
    removeTask(state, action) {
      state.tasks = state.tasks.filter((t) => t._id !== action.payload);
      state.subtasks = state.subtasks.filter((t) => t._id !== action.payload && t.parent !== action.payload);
    },
    setTasks(state, action) {
      state.tasks = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(loadWorkspaces.fulfilled, (s, a) => {
      s.workspaces = a.payload;
    })
      .addCase(loadWorkspace.fulfilled, (s, a) => {
        s.current = a.payload;
      })
      .addCase(loadProjects.fulfilled, (s, a) => {
        s.projects = a.payload;
      })
      .addCase(loadTasks.pending, (s) => {
        s.loading = true;
      })
      .addCase(loadTasks.fulfilled, (s, a) => {
        s.loading = false;
        s.tasks = a.payload.tasks;
        s.subtasks = a.payload.subtasks;
      })
      .addCase(loadNotifications.fulfilled, (s, a) => {
        s.notifications = a.payload;
      })
      .addCase(loadDirectory.fulfilled, (s, a) => {
        s.directory = a.payload;
      });
  },
});

export const { upsertTask, removeTask, setTasks } = slice.actions;
export default slice.reducer;
