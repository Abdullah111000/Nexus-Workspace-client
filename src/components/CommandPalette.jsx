import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCommandOpen } from '../store/uiSlice.js';
import api from '../lib/api.js';

export default function CommandPalette() {
  const open = useSelector((s) => s.ui.commandOpen);
  const { workspaces, projects, current } = useSelector((s) => s.data);
  const dispatch = useDispatch();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (!q) {
        setHits(null);
        return;
      }
      const { data } = await api.get('/search', { params: { q } });
      setHits(data);
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  const items = useMemo(() => {
    if (hits) {
      return [
        ...hits.workspaces.map((w) => ({ label: `Workspace · ${w.name}`, to: `/w/${w._id}` })),
        ...hits.projects.map((p) => ({ label: `Project · ${p.name}`, to: `/w/${p.workspace}/p/${p._id}` })),
        ...hits.tasks.map((t) => ({
          label: `Task · ${t.title}`,
          to: current ? `/w/${current._id}/p/${t.project?._id || t.project}` : '/',
        })),
      ];
    }
    return [
      { label: 'Go home', to: current ? `/w/${current._id}` : '/' },
      { label: 'Settings', to: current ? `/w/${current._id}/settings` : '/' },
      { label: 'Activity', to: current ? `/w/${current._id}/activity` : '/' },
      { label: 'Profile', to: '/profile' },
      ...projects.map((p) => ({ label: `Open ${p.name}`, to: `/w/${current?._id}/p/${p._id}` })),
      ...workspaces.map((w) => ({ label: `Switch to ${w.name}`, to: `/w/${w._id}` })),
    ];
  }, [hits, projects, workspaces, current]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-black/40 p-4 pt-[12vh]" onClick={() => dispatch(setCommandOpen(false))}>
      <div className="panel w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="w-full border-b border-stone-200 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
          placeholder="Jump to a workspace, project, or task…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="max-h-80 overflow-auto p-2">
          {items.length === 0 && <p className="px-2 py-6 text-center text-sm text-stone-400">No results</p>}
          {items.map((it) => (
            <button
              key={it.label + it.to}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-white/10"
              onClick={() => {
                nav(it.to);
                dispatch(setCommandOpen(false));
                setQ('');
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
