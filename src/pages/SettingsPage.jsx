import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../lib/api.js';
import { updateMe } from '../store/authSlice.js';
import { loadProjects, loadWorkspace, loadWorkspaces } from '../store/dataSlice.js';
import { canAdmin, isOwner } from '../lib/utils.js';
import Confirm from '../components/Confirm.jsx';

export default function SettingsPage() {
  const { workspaceId } = useParams();
  const current = useSelector((s) => s.data.current);
  const projects = useSelector((s) => s.data.projects);
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const nav = useNavigate();
  const [invite, setInvite] = useState({ email: '', role: 'member' });
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    dispatch(loadWorkspace(workspaceId));
    dispatch(loadProjects(workspaceId));
  }, [workspaceId, dispatch]);

  if (!current) return <div className="skeleton h-40" />;
  const role = current.myRole;

  async function saveWs(patch) {
    if (!canAdmin(role)) return toast.error('Access denied');
    await api.patch(`/workspaces/${workspaceId}`, patch);
    dispatch(loadWorkspace(workspaceId));
    toast.success('Workspace updated');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="font-display text-4xl">Settings</h1>

      <section className="panel p-6">
        <h2 className="font-semibold">App preferences</h2>
        <p className="text-sm text-stone-500">Theme and default view follow your profile. Notification types:</p>
        <div className="mt-4 space-y-2 text-sm">
          {['assigned', 'mentioned', 'dueSoon'].map((k) => (
            <label key={k} className="flex items-center gap-2 capitalize">
              <input
                type="checkbox"
                checked={user.notificationPrefs?.[k] !== false}
                onChange={(e) => {
                  dispatch(updateMe({ notificationPrefs: { [k]: e.target.checked } }));
                }}
              />
              {k === 'dueSoon' ? 'Due date approaching' : k}
            </label>
          ))}
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="font-semibold">Workspace</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="input" defaultValue={current.name} onBlur={(e) => saveWs({ name: e.target.value })} disabled={!canAdmin(role)} />
          <input className="input" defaultValue={current.icon} onBlur={(e) => saveWs({ icon: e.target.value })} disabled={!canAdmin(role)} />
          <input className="input h-10 cursor-pointer p-1" type="color" defaultValue={current.color} onChange={(e) => saveWs({ color: e.target.value })} disabled={!canAdmin(role)} />
          <select className="input" defaultValue={current.defaultView} onChange={(e) => saveWs({ defaultView: e.target.value })} disabled={!canAdmin(role)}>
            <option value="board">Board</option>
            <option value="list">List</option>
            <option value="calendar">Calendar</option>
          </select>
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="font-semibold">Members & roles</h2>
        <div className="mt-4 space-y-2">
          {current.members?.map((m) => (
            <div key={m.user?._id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {m.user?.name} <span className="text-stone-400">{m.user?.email}</span>
              </span>
              <div className="flex gap-2">
                <select
                  className="input font-medium"
                  style={{ width: m.role === 'owner' ? '200px' : '112px', minWidth: m.role === 'owner' ? '200px' : '112px' }}
                  value={m.role}
                  disabled={!canAdmin(role) || m.role === 'owner'}
                  onChange={async (e) => {
                    await api.patch(`/workspaces/${workspaceId}/members/${m.user._id}`, { role: e.target.value });
                    dispatch(loadWorkspace(workspaceId));
                  }}
                >
                  <option>owner</option>
                  <option>admin</option>
                  <option>member</option>
                  <option>viewer</option>
                </select>
                {canAdmin(role) && m.role !== 'owner' && (
                  <button
                    className="btn-ghost text-red-600"
                    onClick={async () => {
                      await api.delete(`/workspaces/${workspaceId}/members/${m.user._id}`);
                      dispatch(loadWorkspace(workspaceId));
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {canAdmin(role) && (
          <form
            className="mt-4 flex flex-wrap gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post(`/workspaces/${workspaceId}/invite`, invite);
                dispatch(loadWorkspace(workspaceId));
                toast.success('Member added');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Invite failed');
              }
            }}
          >
            <input className="input flex-1" placeholder="email@demo.com" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
            <select className="input w-32" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
              <option>admin</option>
              <option>member</option>
              <option>viewer</option>
            </select>
            <button className="btn-primary">Invite</button>
          </form>
        )}
      </section>

      <section className="panel p-6">
        <h2 className="font-semibold">Projects</h2>
        {projects.map((p) => (
          <div key={p._id} className="mt-3 flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 py-2 text-sm dark:border-white/10">
            <span>
              {p.icon} {p.name} {p.archived ? '(archived)' : ''}
            </span>
            <div className="flex gap-2">
              {canEditish(role) && (
                <button className="btn-ghost" onClick={() => api.patch(`/projects/${p._id}`, { archived: !p.archived }).then(() => dispatch(loadProjects(workspaceId)))}>
                  {p.archived ? 'Unarchive' : 'Archive'}
                </button>
              )}
              {canAdmin(role) && (
                <button
                  className="btn-ghost text-red-600"
                  onClick={() =>
                    setConfirm({
                      title: `Delete project “${p.name}”?`,
                      onYes: async () => {
                        await api.delete(`/projects/${p._id}`);
                        dispatch(loadProjects(workspaceId));
                      },
                    })
                  }
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="panel p-6">
        <h2 className="font-semibold">Data</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="btn-ghost"
            onClick={async () => {
              const { data } = await api.get(`/workspaces/${workspaceId}/export`);
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `${current.name.replace(/\s+/g, '-')}.json`;
              a.click();
            }}
          >
            Export JSON
          </button>
          <label className="btn-ghost cursor-pointer">
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const json = JSON.parse(await file.text());
                try {
                  await api.post(`/workspaces/${workspaceId}/import`, json);
                  toast.success('Imported');
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Invalid file');
                }
              }}
            />
          </label>
        </div>
      </section>

      <section className="panel border-red-200 p-6 dark:border-red-900/40">
        <h2 className="font-semibold text-red-700">Danger zone</h2>
        <p className="mt-1 text-sm text-stone-500">Destructive actions require confirmation.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {isOwner(role) && (
            <button
              className="btn-ghost text-red-700"
              onClick={() =>
                setConfirm({
                  title: 'Reset all workspace data?',
                  body: 'Projects, tasks, comments and activity will be wiped.',
                  onYes: async () => {
                    await api.post(`/workspaces/${workspaceId}/reset`);
                    dispatch(loadProjects(workspaceId));
                    toast.success('Workspace reset');
                  },
                })
              }
            >
              Reset workspace data
            </button>
          )}
          {isOwner(role) && (
            <button
              className="btn-primary bg-red-600 hover:bg-red-700"
              onClick={() =>
                setConfirm({
                  title: 'Delete this workspace forever?',
                  onYes: async () => {
                    await api.delete(`/workspaces/${workspaceId}`);
                    await dispatch(loadWorkspaces());
                    nav('/');
                  },
                })
              }
            >
              Delete workspace
            </button>
          )}
          {!canAdmin(role) && <p className="text-sm text-amber-700">Access denied for admin actions.</p>}
        </div>
      </section>
      {confirm && <Confirm {...confirm} onClose={() => setConfirm(null)} />}
    </div>
  );
}

function canEditish(role) {
  return role === 'member' || role === 'admin' || role === 'owner';
}
