import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loadProjects, loadWorkspace, loadWorkspaces } from '../store/dataSlice.js';
import api from '../lib/api.js';
import { toast } from 'sonner';
import { canEdit } from '../lib/utils.js';

export default function WorkspaceHome() {
  const current = useSelector((s) => s.data.current);
  const projects = useSelector((s) => s.data.projects);
  const loading = useSelector((s) => s.data.loading);
  const dispatch = useDispatch();
  const nav = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('sprint');
  const role = current?.myRole;

  useEffect(() => {
    api.get('/projects/templates').then((r) => setTemplates(r.data));
  }, []);

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
            {current.icon} {current.name}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Your role: <span className="font-medium capitalize text-ink-900 dark:text-ink-50">{role}</span>
          </p>
        </div>
        {canEdit(role) && (
          <form
            className="flex flex-wrap gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await api.post(`/projects/workspace/${current._id}`, { name: name || 'New project', template });
              setName('');
              dispatch(loadProjects(current._id));
              toast.success('Project created');
            }}
          >
            <input className="input w-44" placeholder="New project" value={name} onChange={(e) => setName(e.target.value)} />
            <select className="input w-40" value={template} onChange={(e) => setTemplate(e.target.value)}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button className="btn-primary">Create</button>
          </form>
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
            className="panel p-5 text-left transition hover:-translate-y-0.5"
            onClick={() => nav(`/w/${current._id}/p/${p._id}`)}
          >
            <div className="text-2xl" style={{ color: p.color }}>
              {p.icon}
            </div>
            <h3 className="mt-2 text-lg font-semibold">{p.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-stone-500">{p.description || 'No description'}</p>
          </button>
        ))}
        {!projects.length && (
          <div className="panel col-span-full p-12 text-center text-stone-500">No projects yet. Create one to begin.</div>
        )}
      </div>
    </div>
  );
}

function CreateWorkspace() {
  const [name, setName] = useState('My workspace');
  const dispatch = useDispatch();
  const nav = useNavigate();
  return (
    <form
      className="mt-6 flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const { data } = await api.post('/workspaces', { name });
        await dispatch(loadWorkspaces());
        dispatch(loadWorkspace(data._id));
        dispatch(loadProjects(data._id));
        nav(`/w/${data._id}`);
      }}
    >
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      <button className="btn-primary">Create</button>
    </form>
  );
}
