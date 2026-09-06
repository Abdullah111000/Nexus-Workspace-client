import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState({ tasks: [], projects: [], workspaces: [] });
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setHits({ tasks: [], projects: [], workspaces: [] });
        return;
      }
      const { data } = await api.get('/search', { params: { q } });
      setHits(data);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const empty = !hits.tasks.length && !hits.projects.length && !hits.workspaces.length;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl">Search</h1>
      <input className="input mt-4" placeholder="Tasks, projects, workspaces…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="mt-6 space-y-6">
        {q && empty && <div className="panel p-10 text-center text-stone-400">No search results.</div>}
        {!!hits.workspaces.length && (
          <section>
            <h2 className="text-xs uppercase tracking-wide text-stone-400">Workspaces</h2>
            {hits.workspaces.map((w) => (
              <button key={w._id} className="panel mt-2 block w-full p-3 text-left" onClick={() => nav(`/w/${w._id}`)}>
                {w.icon} {w.name}
              </button>
            ))}
          </section>
        )}
        {!!hits.projects.length && (
          <section>
            <h2 className="text-xs uppercase tracking-wide text-stone-400">Projects</h2>
            {hits.projects.map((p) => (
              <button key={p._id} className="panel mt-2 block w-full p-3 text-left" onClick={() => nav(`/w/${p.workspace}/p/${p._id}`)}>
                {p.icon} {p.name}
              </button>
            ))}
          </section>
        )}
        {!!hits.tasks.length && (
          <section>
            <h2 className="text-xs uppercase tracking-wide text-stone-400">Tasks</h2>
            {hits.tasks.map((t) => (
              <button
                key={t._id}
                className="panel mt-2 block w-full p-3 text-left"
                onClick={() => nav(`/w/${t.workspace}/p/${t.project?._id || t.project}`)}
              >
                {t.title} <span className="text-stone-400">· {t.project?.name}</span>
              </button>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
