import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './store/authSlice.js';
import { setOffline, setTheme, setCommandOpen } from './store/uiSlice.js';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Shell from './pages/Shell.jsx';

export default function App() {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  const user = useSelector((s) => s.auth.user);
  const status = useSelector((s) => s.auth.status);
  const token = localStorage.getItem('wm_token');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (user?.theme) dispatch(setTheme(user.theme));
  }, [user?.theme, dispatch]);

  useEffect(() => {
    if (token) dispatch(fetchMe());
    const on = () => dispatch(setOffline(false));
    const off = () => dispatch(setOffline(true));
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const keys = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatch(setCommandOpen(true));
      }
    };
    window.addEventListener('keydown', keys);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('keydown', keys);
    };
  }, [dispatch, token]);

  if (token && status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-50 dark:bg-ink-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-accent dark:border-white/15 dark:border-t-accent" aria-label="Loading" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
      <Route path="/*" element={user ? <Shell /> : <Navigate to="/login" />} />
    </Routes>
  );
}
