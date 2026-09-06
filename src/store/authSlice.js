import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../lib/api.js';
import { resetSocket } from '../lib/socket.js';

export const fetchMe = createAsyncThunk('auth/me', async () => {
  const { data } = await api.get('/users/me');
  return data;
});

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    localStorage.setItem('wm_token', data.token);
    return data.user;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Login failed');
  }
});

export const signup = createAsyncThunk('auth/signup', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/signup', payload);
    localStorage.setItem('wm_token', data.token);
    return data.user;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Signup failed');
  }
});

export const updateMe = createAsyncThunk('auth/update', async (payload) => {
  const { data } = await api.patch('/users/me', payload);
  return data;
});

const slice = createSlice({
  name: 'auth',
  initialState: { user: null, status: 'idle', error: null },
  reducers: {
    logout(state) {
      state.user = null;
      localStorage.removeItem('wm_token');
      resetSocket();
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMe.pending, (s) => {
      s.status = 'loading';
    })
      .addCase(fetchMe.fulfilled, (s, a) => {
        s.status = 'ready';
        s.user = a.payload;
      })
      .addCase(fetchMe.rejected, (s) => {
        s.status = 'idle';
        s.user = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.user = a.payload;
        s.error = null;
        s.status = 'ready';
      })
      .addCase(login.rejected, (s, a) => {
        s.error = a.payload;
      })
      .addCase(signup.fulfilled, (s, a) => {
        s.user = a.payload;
        s.error = null;
        s.status = 'ready';
      })
      .addCase(signup.rejected, (s, a) => {
        s.error = a.payload;
      })
      .addCase(updateMe.fulfilled, (s, a) => {
        s.user = a.payload;
      });
  },
});

export const { logout } = slice.actions;
export default slice.reducer;
