import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/api.js';

export default function ActivityPage() {
  const { workspaceId } = useParams();
  const current = useSelector((s) => s.data.current);
  const projects = useSelector((s) => s.data.projects);
  const [items, setItems] = useState([]);
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [project, setProject] = useState('');

  useEffect(() => {
    if (!workspaceId) return;
    api
      .get(`/activity/workspace/${workspaceId}`, { params: { actor, action, project } })
      .then((r) => setItems(r.data));
  }, [workspaceId, actor, action, project]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl">Activity</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <select className="input w-48" value={actor} onChange={(e) => setActor(e.target.value)}>
          <option value="">All people</option>
          {current?.members?.map((m) => (
            <option key={m.user?._id} value={m.user?._id}>
              {m.user?.name}
            </option>
          ))}
        </select>
        <select className="input w-48" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          {['task.created', 'task.edited', 'task.status_changed', 'task.completed', 'task.deleted', 'task.commented', 'project.created', 'member.invited'].map(
            (a) => (
              <option key={a}>{a}</option>
            )
          )}
        </select>
        <select className="input w-48" value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-6 space-y-2">
        {!items.length && <div className="panel p-10 text-center text-stone-400">No activity yet.</div>}
        {items.map((a) => (
          <div key={a._id} className="panel flex items-center justify-between p-4 text-sm">
            <div>
              <b>{a.actor?.name}</b> {pretty(a.action)} {a.meta?.title ? `“${a.meta.title}”` : ''}
            </div>
            <span className="text-xs text-stone-400">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function pretty(action) {
  return action.replace(/\./g, ' · ').replace(/_/g, ' ');
}
