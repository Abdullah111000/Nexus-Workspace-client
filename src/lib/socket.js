import { io } from 'socket.io-client';
import { API_ORIGIN } from './api.js';

let socket;

export function getSocket() {
  const token = localStorage.getItem('wm_token');
  if (!token) return null;
  if (!socket) {
    socket = io(API_ORIGIN || '/', { auth: { token } });
  }
  return socket;
}

export function resetSocket() {
  socket?.disconnect();
  socket = null;
}
