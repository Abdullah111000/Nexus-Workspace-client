import axios from 'axios';

/** Production (Vercel): set VITE_API_URL to https://your-api.onrender.com/api */
export const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Backend origin for sockets and /uploads (no trailing slash). */
export const API_ORIGIN = (
  import.meta.env.VITE_SOCKET_URL ||
  String(API_BASE).replace(/\/api\/?$/, '') ||
  ''
).replace(/\/$/, '');

export function resolveUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('wm_token');
      if (!window.location.pathname.startsWith('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
