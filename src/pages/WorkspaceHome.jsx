import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loadProjects, loadWorkspace, loadWorkspaces } from '../store/dataSlice.js';
import api from '../lib/api.js';
import { toast } from 'sonner';
import { canEdit, getMyRole } from '../lib/utils.js';
import { Plus, FolderPlus, X } from 'lucide-react';

export default function WorkspaceHome() {
  const user = useSelector((s) => s.auth.user);
  const current = useSelector((s) => s.data.current);
  const workspaces = useSelector((s) => s.data.workspaces);
  const workspacesStatus = useSelector((s) => s.data.workspacesStatus);
  const currentStatus = useSelector((s) => s.data.currentStatus);
  const projects = useSelector((s) => s.data.projects);
  const dispatch = useDispatch();
  const nav = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const role = getMyRole(current, user);
  const workspaceLoading =
    workspacesStatus === 'loading' || (workspaces.length > 0 && currentStatus === 'loading');
  const workspaceError =
    workspacesStatus === 'error' || (workspaces.length > 0 && currentStatus === 'error');

  useEffect(() => {
    api.get('/projects/templates').then((r) => setTemplates(r.data));
  }, []);

  if (workspaceLoading) {
    return (
      <div className="grid place-items-center py-24" aria-label="Loading workspace">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-accent" />
      </div>
    );
  }

  if (workspaceError) {
    return (
      <div className="grid place-items-center py-24">
        <div className="panel max-w-md p-8 text-center">
          <h1 className="font-display text-2xl">Workspace could not load</h1>
          <p className="mt-2 text-sm text-stone-500">The server did not return your workspace data.</p>
          <button className="btn-primary mt-6" type="button" onClick={() => dispatch(loadWorkspaces())}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="grid place-items-center py-24">
        <div className="panel max-w-md p-8 text-center">
          <h1 className="font-display text-3xl">Create a workspace</h1>
          <p className="mt-2 text-sm text-stone-500">You are not in a workspace yet.</p>
          <CreateWorkspace />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Workspace</p>
          <h1 className="font-display mt-1 text-4xl">
            <span style={{ color: current.color }}>{current.icon}</span> {current.name}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Your role: <span className="font-medium capitalize text-ink-900 dark:text-ink-50">{role}</span>
          </p>
        </div>
        {canEdit(role) && (
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => setCreateProjectOpen(true)}
          >
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-stone-500">People</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {current.members?.map((m) => (
            <div key={m.user?._id || m.user} className="rounded-full border border-stone-200 px-3 py-1 text-xs dark:border-white/10">
              {m.user?.name} · {m.role}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <button
            key={p._id}
            className="panel p-5 text-left transition hover:-translate-y-0.5 group"
            onClick={() => nav(`/w/${current._id}/p/${p._id}`)}
          >
            <div className="text-2xl" style={{ color: p.color }}>
              {p.icon}
            </div>
            <h3 className="mt-2 text-lg font-semibold group-hover:text-accent transition-colors">{p.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-stone-500">{p.description || 'No description provided'}</p>
          </button>
        ))}
        {!projects.length && (
          <div className="panel col-span-full p-12 text-center text-stone-500">
            <FolderPlus size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-base font-medium">No projects yet</p>
            <p className="mt-1 text-sm">Create your first project to start organizing tasks.</p>
            {canEdit(role) && (
              <button
                className="btn-primary mt-4 inline-flex items-center gap-2"
                onClick={() => setCreateProjectOpen(true)}
              >
                <Plus size={16} /> Create Project
              </button>
            )}
          </div>
        )}
      </div>

      {createProjectOpen && (
        <CreateProjectModal
          workspaceId={current._id}
          templates={templates}
          onClose={() => setCreateProjectOpen(false)}
          onSuccess={() => dispatch(loadProjects(current._id))}
        />
      )}
    </div>
  );
}

function CreateProjectModal({ workspaceId, templates, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('sprint');
  const [icon, setIcon] = useState('◈');
  const [color, setColor] = useState('#8b5cf6');
  const [saving, setSaving] = useState(false);

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];
  const icons = ['◈', '⚡', '🚀', '🎯', '📌', '🔥', '💻', '🎨', '📊', '🛠️'];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await api.post(`/projects/workspace/${workspaceId}`, {
        name: name.trim(),
        description: description.trim(),
        template,
        icon,
        color,
      });
      toast.success('Project created successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-950/45 p-4" role="presentation" onMouseDown={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-ink-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-project-title" className="font-display text-2xl">Create Project</h2>
            <p className="mt-1 text-sm text-stone-500">Set up a new project in your workspace.</p>
          </div>
          <button
            type="button"
            className="btn-ghost px-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              className="input w-full"
              placeholder="e.g. Mobile App Launch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              className="input w-full h-24 py-2.5 resize-none"
              placeholder="Write a brief description of the project goals, scope, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template</label>
              <select className="input w-full" value={template} onChange={(e) => setTemplate(e.target.value)}>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Icon</label>
              <div className="flex flex-wrap gap-1 p-1 border border-stone-200 dark:border-white/10 rounded-xl bg-stone-50/50 dark:bg-white/5">
                {icons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    className={`h-7 w-7 rounded-lg text-sm transition flex items-center justify-center ${
                      icon === ic
                        ? 'bg-white dark:bg-white/20 shadow-sm border border-stone-200 dark:border-white/20 scale-105'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                    onClick={() => setIcon(ic)}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color Theme</label>
            <div className="flex items-center gap-2 pt-1">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{ backgroundColor: c }}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-accent ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-100 dark:border-white/10">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-2px]" aria-label="Loading" />}
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateWorkspace() {
  const [name, setName] = useState('My workspace');
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const nav = useNavigate();
  return (
    <form
      className="mt-6 flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        try {
          const { data } = await api.post('/workspaces', { name });
          await dispatch(loadWorkspaces());
          dispatch(loadWorkspace(data._id));
          dispatch(loadProjects(data._id));
          nav(`/w/${data._id}`);
        } finally {
          setSaving(false);
        }
      }}
    >
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      <button className="btn-primary inline-flex items-center gap-2" disabled={saving}>
        {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="Loading" />}
        {saving ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
