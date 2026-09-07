import { useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  CalendarDays,
  Check,
  ChevronDown,
  Command,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  WifiOff,
} from 'lucide-react';
import { logout, updateMe } from '../store/authSlice.js';
import { loadDirectory, loadNotifications, loadProjects, loadWorkspace, loadWorkspaces } from '../store/dataSlice.js';
import { setCommandOpen, setTheme, setSidebar, toggleSidebar, setSyncing, clearQueue } from '../store/uiSlice.js';
import { getSocket } from '../lib/socket.js';
import { initials } from '../lib/utils.js';
import api from '../lib/api.js';
import { toast } from 'sonner';
import CommandPalette from '../components/CommandPalette.jsx';
import Notifications from '../components/Notifications.jsx';
import WorkspaceHome from './WorkspaceHome.jsx';
import ProjectPage from './ProjectPage.jsx';
import SettingsPage from './SettingsPage.jsx';
import ProfilePage from './ProfilePage.jsx';
import ActivityPage from './ActivityPage.jsx';
import SearchPage from './SearchPage.jsx';

export default function Shell() {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { workspaces, current, notifications } = useSelector((s) => s.data);
  const { theme, sidebarOpen, offline, pendingQueue } = useSelector((s) => s.ui);
  const { workspaceId } = useParams();
  const wsId = workspaceId || current?._id || workspaces[0]?._id;
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);

  useEffect(() => {
    dispatch(loadWorkspaces());
    dispatch(loadDirectory());
    dispatch(loadNotifications());
    api.post('/notifications/due-check').finally(() => dispatch(loadNotifications()));
  }, [dispatch]);

  useEffect(() => {
    if (workspaces.length && !current) {
      const id = workspaces[0]._id;
      dispatch(loadWorkspace(id));
      dispatch(loadProjects(id));
    }
  }, [workspaces, current, dispatch]);

  useEffect(() => {
    if (!wsId) return;
    const s = getSocket();
    s?.emit('join:workspace', wsId);
    s?.on('notification:new', () => dispatch(loadNotifications()));
    s?.on('task:updated', () => {});
    return () => {
      s?.emit('leave:workspace', wsId);
      s?.off('notification:new');
    };
  }, [wsId, dispatch]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        nav(wsId ? `/w/${wsId}` : '/');
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        /* handled in project page via event */
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav, wsId]);

  async function syncOffline() {
    dispatch(setSyncing(true));
    try {
      for (const item of pendingQueue) {
        await api.request(item);
      }
      dispatch(clearQueue());
      toast.success('Offline changes synced');
      if (wsId) {
        dispatch(loadWorkspace(wsId));
        dispatch(loadProjects(wsId));
      }
    } catch {
      toast.error('Some changes could not sync');
    } finally {
      dispatch(setSyncing(false));
    }
  }

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => dispatch(setSidebar(false))} />
      )}
      <aside
        className={`fixed z-40 flex h-full w-[260px] flex-col border-r border-stone-200/80 bg-[#f7f3ea] dark:border-white/10 dark:bg-ink-900 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-sm text-ink-50 dark:bg-accent">N</span>
          <div>
            <div className="text-sm font-semibold">Nexus</div>
            <div className="text-[11px] text-stone-500">Workspace OS</div>
          </div>
        </div>
        <WorkspaceSelector onCreateWorkspace={() => setCreateWorkspaceOpen(true)} />
        <nav className="flex-1 space-y-1 px-2 text-sm">
          <NavLink className={navCls} to={current ? `/w/${current._id}` : '/'}>
            <LayoutDashboard size={16} /> Home
          </NavLink>
          <NavLink className={navCls} to={current ? `/w/${current._id}/activity` : '/activity'}>
            <CalendarDays size={16} /> Activity
          </NavLink>
          <NavLink className={navCls} to="/search">
            <Search size={16} /> Search
          </NavLink>
          <NavLink className={navCls} to={current ? `/w/${current._id}/settings` : '/settings'}>
            <Settings size={16} /> Settings
          </NavLink>
          <div className="px-3 pb-1 pt-4 text-[11px] uppercase tracking-wider text-stone-400">Projects</div>
          <ProjectLinks />
        </nav>
        <button
          className="m-3 flex items-center gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5"
          onClick={() => nav('/profile')}
        >
          <Avatar name={user.name} src={user.avatar} />
          <span className="truncate">{user.name}</span>
        </button>
      </aside>

      {createWorkspaceOpen && <CreateWorkspaceModal onClose={() => setCreateWorkspaceOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-stone-200/70 bg-ink-50/80 px-3 py-2 backdrop-blur dark:border-white/10 dark:bg-ink-950/80">
          <button className="btn-ghost px-2" onClick={() => dispatch(toggleSidebar())}>
            <Menu size={16} />
          </button>
          <button className="btn-ghost min-w-0 flex-1 justify-start text-stone-500" onClick={() => dispatch(setCommandOpen(true))}>
            <Command size={14} className="shrink-0" /> <span className="truncate">Search or jump…</span> <span className="kbd ml-auto hidden sm:inline">⌘K</span>
          </button>
          {offline && (
            <span className="flex items-center gap-1 text-xs text-amber-700">
              <WifiOff size={14} /> Offline
            </span>
          )}
          <button className="btn-ghost text-xs" onClick={syncOffline}>
            Sync
          </button>
          <button
            className="btn-ghost px-2"
            onClick={() => {
              const next = theme === 'dark' ? 'light' : 'dark';
              dispatch(setTheme(next));
              dispatch(updateMe({ theme: next }));
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Notifications count={notifications.unread} />
          <button className="btn-ghost px-2 sm:px-3.5" onClick={() => dispatch(logout())} aria-label="Log out" title="Log out">
            <LogOut size={14} className="sm:hidden" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<WorkspaceHome />} />
            <Route path="/w/:workspaceId" element={<WorkspaceHome />} />
            <Route path="/w/:workspaceId/p/:projectId" element={<ProjectPage />} />
            <Route path="/w/:workspaceId/settings" element={<SettingsPage />} />
            <Route path="/w/:workspaceId/activity" element={<ActivityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

function navCls({ isActive }) {
  return `flex items-center gap-2 rounded-xl px-3 py-2 ${isActive ? 'bg-white shadow-sm dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`;
}

function ProjectLinks() {
  const projects = useSelector((s) => s.data.projects);
  const current = useSelector((s) => s.data.current);
  if (!current) return null;
  if (!projects.length) return <p className="px-3 text-xs text-stone-400">No projects yet</p>;
  return projects.map((p) => (
    <NavLink key={p._id} className={navCls} to={`/w/${current._id}/p/${p._id}`}>
      <span style={{ color: p.color }}>{p.icon}</span>
      <span className="truncate">{p.name}</span>
    </NavLink>
  ));
}

export function Avatar({ name, src, size = 'h-8 w-8' }) {
  if (src) return <img src={src} alt="" className={`${size} rounded-full object-cover`} />;
  return (
    <span className={`${size} grid place-items-center rounded-full bg-ink-900 text-[11px] font-medium text-white dark:bg-accent`}>
      {initials(name)}
    </span>
  );
}

function WorkspaceSelector({ onCreateWorkspace }) {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { workspaces, current } = useSelector((s) => s.data);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!workspaces?.length) return null;

  return (
    <div className="relative px-2 mb-3" ref={ref}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-white shadow-sm border border-stone-200/80 hover:bg-stone-50/80 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15 transition text-left cursor-pointer text-ink-900 dark:text-ink-50"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2 truncate">
          <span style={{ color: current?.color || undefined }}>{current?.icon || '✦'}</span>
          <span className="truncate">{current?.name || 'Workspace'}</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 text-stone-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-2 right-2 top-full mt-1.5 z-50 rounded-xl border border-stone-200/90 bg-white/95 p-1 shadow-lg backdrop-blur dark:border-white/10 dark:bg-ink-900/95">
          {workspaces.map((w) => {
            const isSelected = w._id === current?._id;
            return (
              <button
                key={w._id}
                type="button"
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isSelected
                    ? 'bg-stone-100 dark:bg-white/10 text-ink-900 dark:text-ink-50'
                    : 'hover:bg-stone-50 dark:hover:bg-white/5 text-stone-600 dark:text-stone-300'
                }`}
                onClick={() => {
                  dispatch(loadWorkspace(w._id));
                  dispatch(loadProjects(w._id));
                  nav(`/w/${w._id}`);
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2 truncate">
                  <span>{w.icon}</span>
                  <span className="truncate">{w.name}</span>
                </span>
                {isSelected && <Check size={14} className="shrink-0 text-accent" />}
              </button>
            );
          })}
          <button
            type="button"
            className="mt-1 flex w-full items-center gap-2 border-t border-stone-200/80 px-3 py-2.5 text-left text-sm font-medium text-accent transition hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5"
            onClick={() => {
              onCreateWorkspace();
              setOpen(false);
            }}
          >
            <Plus size={16} />
            <span>Create Workspace</span>
          </button>
        </div>
      )}
    </div>
  );
}

function CreateWorkspaceModal({ onClose }) {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const [name, setName] = useState('My workspace');
  const [saving, setSaving] = useState(false);

  async function createWorkspace(e) {
    e.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    try {
      const { data } = await api.post('/workspaces', { name: name.trim() });
      await dispatch(loadWorkspaces());
      dispatch(loadWorkspace(data._id));
      dispatch(loadProjects(data._id));
      nav(`/w/${data._id}`);
      toast.success('Workspace created');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create workspace');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-950/45 p-4" role="presentation" onMouseDown={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-ink-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-workspace-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-workspace-title" className="font-display text-2xl">Create Workspace</h2>
            <p className="mt-1 text-sm text-stone-500">Start a new space for your team.</p>
          </div>
          <button type="button" className="btn-ghost px-2" onClick={onClose} aria-label="Close modal">×</button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={createWorkspace}>
          <label className="block text-sm font-medium">
            Workspace name
            <input
              className="input mt-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

