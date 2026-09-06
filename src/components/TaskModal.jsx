import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import api, { resolveUrl } from '../lib/api.js';
import { canEdit } from '../lib/utils.js';
import Confirm from './Confirm.jsx';

export default function TaskModal({ taskId, onClose, onDelete }) {
  const me = useSelector((s) => s.auth.user);
  const role = useSelector((s) => s.data.current?.myRole);
  const directory = useSelector((s) => s.data.directory);
  const current = useSelector((s) => s.data.current);
  const [task, setTask] = useState(null);
  const [subs, setSubs] = useState([]);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState('details');
  const [body, setBody] = useState('');
  const [mentionOpen, setMentionOpen] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const [subTitle, setSubTitle] = useState('');
  const editable = canEdit(role);

  async function load() {
    const { data } = await api.get(`/tasks/${taskId}`);
    setTask(data.task);
    setSubs(data.subtasks);
    const c = await api.get(`/comments/task/${taskId}`);
    setComments(c.data);
    const a = await api.get(`/activity/workspace/${data.task.workspace}`, { params: { task: taskId } });
    setActivity(a.data);
  }

  useEffect(() => {
    load();
  }, [taskId]);

  const members = current?.members?.map((m) => m.user) || directory;

  async function save(patch) {
    if (!editable) return toast.error('Access denied');
    const { data } = await api.patch(`/tasks/${taskId}`, patch);
    setTask(data);
  }

  const mentionCandidates = useMemo(() => {
    const last = body.split('@').pop();
    if (!body.includes('@') || last.includes(' ')) return [];
    return members.filter((u) => u.name?.toLowerCase().includes(last.toLowerCase()));
  }, [body, members]);

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
        <div className="panel h-40 w-full max-w-2xl p-8">
          <div className="skeleton h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" onClick={onClose}>
      <div className="panel max-h-[90vh] w-full max-w-3xl overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 p-5 dark:border-white/10">
          <input
            className="w-full bg-transparent text-xl font-semibold outline-none"
            value={task.title}
            disabled={!editable}
            onChange={(e) => setTask({ ...task, title: e.target.value })}
            onBlur={() => save({ title: task.title })}
          />
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_220px]">
          <div>
            <div className="mb-3 flex gap-2 text-sm">
              {['details', 'comments', 'activity'].map((t) => (
                <button key={t} className={tab === t ? 'btn-primary capitalize' : 'btn-ghost capitalize'} onClick={() => setTab(t)}>
                  {t}
                </button>
              ))}
            </div>
            {tab === 'details' && (
              <>
                <textarea
                  className="input min-h-28"
                  placeholder="Description"
                  disabled={!editable}
                  value={task.description || ''}
                  onChange={(e) => setTask({ ...task, description: e.target.value })}
                  onBlur={() => save({ description: task.description })}
                />
                <h3 className="mt-6 text-sm font-medium">Subtasks</h3>
                <div className="mt-2 space-y-1">
                  {subs.map((s) => (
                    <div key={s._id} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-stone-50 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={s.completed}
                        disabled={!editable}
                        onChange={async () => {
                          await api.patch(`/tasks/${s._id}`, { completed: !s.completed });
                          load();
                        }}
                      />
                      <span className={`flex-1 text-sm ${s.completed ? 'text-stone-400 line-through' : ''}`}>{s.title}</span>
                      {editable && (
                        <button
                          className="text-xs text-accent"
                          onClick={async () => {
                            await api.post(`/tasks/${s._id}/convert`, { to: 'task' });
                            toast.success('Converted to task');
                            load();
                          }}
                        >
                          Promote
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {editable && (
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!subTitle.trim()) return;
                      await api.post(`/tasks/project/${task.project._id || task.project}`, { title: subTitle, parent: task._id, status: task.status });
                      setSubTitle('');
                      load();
                    }}
                  >
                    <input className="input" placeholder="Add subtask" value={subTitle} onChange={(e) => setSubTitle(e.target.value)} />
                    <button className="btn-ghost">Add</button>
                  </form>
                )}
                <h3 className="mt-6 text-sm font-medium">Attachments</h3>
                <div className="mt-2 space-y-1 text-sm">
                  {task.attachments?.map((a) => (
                    <a key={a._id} className="block text-accent" href={resolveUrl(a.url)} target="_blank" rel="noreferrer">
                      {a.originalName}
                    </a>
                  ))}
                </div>
                {editable && (
                  <input
                    type="file"
                    className="mt-2 text-xs"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append('file', file);
                      await api.post(`/tasks/${task._id}/attachments`, fd);
                      toast.success('File attached');
                      load();
                    }}
                  />
                )}
              </>
            )}
            {tab === 'comments' && (
              <div>
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c._id} className="rounded-xl bg-stone-50 p-3 text-sm dark:bg-white/5">
                      <div className="flex justify-between text-xs text-stone-400">
                        <span className="font-medium text-ink-900 dark:text-ink-50">{c.author?.name}</span>
                        <span>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="mt-1">{c.body}</p>
                      {me?.id === c.author?._id && (
                        <div className="mt-2 flex gap-2 text-xs">
                          <button
                            className="text-accent"
                            onClick={async () => {
                              const next = prompt('Edit comment', c.body);
                              if (next == null) return;
                              await api.patch(`/comments/${c._id}`, { body: next });
                              load();
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600"
                            onClick={async () => {
                              await api.delete(`/comments/${c._id}`);
                              load();
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {editable ? (
                  <form
                    className="relative mt-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const mentions = members.filter((m) => body.includes('@' + m.name)).map((m) => m.id || m._id);
                      await api.post(`/comments/task/${task._id}`, { body, mentions });
                      setBody('');
                      load();
                    }}
                  >
                    <textarea className="input min-h-20" placeholder="Write a comment… use @ to mention" value={body} onChange={(e) => setBody(e.target.value)} />
                    {!!mentionCandidates.length && (
                      <div className="panel absolute bottom-16 left-0 z-10 w-56 p-1">
                        {mentionCandidates.map((u) => (
                          <button
                            type="button"
                            key={u.id || u._id}
                            className="block w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-stone-100 dark:hover:bg-white/10"
                            onClick={() => {
                              setBody(body.replace(/@[^@]*$/, '@' + u.name + ' '));
                            }}
                          >
                            {u.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <button className="btn-primary mt-2">Comment</button>
                  </form>
                ) : (
                  <p className="mt-4 text-sm text-stone-400">Viewers cannot comment.</p>
                )}
              </div>
            )}
            {tab === 'activity' && (
              <div className="space-y-2 text-sm">
                {activity.map((a) => (
                  <div key={a._id} className="flex justify-between gap-3 rounded-lg px-2 py-1">
                    <span>
                      <b>{a.actor?.name}</b> {a.action.replace('task.', '').replace('_', ' ')}
                    </span>
                    <span className="text-xs text-stone-400">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <aside className="space-y-3 text-sm">
            <label className="text-xs uppercase text-stone-400">Status</label>
            <select className="input" disabled={!editable} value={task.status} onChange={(e) => save({ status: e.target.value })}>
              {(task.project?.columns || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="text-xs uppercase text-stone-400">Priority</label>
            <select className="input" disabled={!editable} value={task.priority} onChange={(e) => save({ priority: e.target.value })}>
              {['low', 'medium', 'high', 'urgent'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <label className="text-xs uppercase text-stone-400">Assignee</label>
            <select
              className="input"
              disabled={!editable}
              value={task.assignee?._id || ''}
              onChange={(e) => save({ assignee: e.target.value || null })}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m._id || m.id} value={m._id || m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <label className="text-xs uppercase text-stone-400">Due date</label>
            <input
              className="input"
              type="date"
              disabled={!editable}
              value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
              onChange={(e) => save({ dueDate: e.target.value || null })}
            />
            <label className="text-xs uppercase text-stone-400">Labels (comma)</label>
            <input
              className="input"
              disabled={!editable}
              defaultValue={task.labels?.join(', ')}
              onBlur={(e) => save({ labels: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled={!editable} checked={task.completed} onChange={(e) => save({ completed: e.target.checked })} />
              Completed
            </label>
            {editable && (
              <>
                <button
                  className="btn-ghost w-full"
                  onClick={async () => {
                    const { data } = await api.post(`/tasks/${task._id}/duplicate`);
                    toast.success('Duplicated');
                    onClose();
                  }}
                >
                  Duplicate
                </button>
                <button className="btn-ghost w-full text-red-600" onClick={() => setConfirm(true)}>
                  Delete
                </button>
              </>
            )}
            {!editable && <p className="text-xs text-amber-700">Access denied — viewers cannot edit.</p>}
          </aside>
        </div>
      </div>
      {confirm && (
        <Confirm
          title="Delete this task?"
          onYes={async () => {
            await onDelete(task._id);
            onClose();
          }}
          onClose={() => setConfirm(false)}
        />
      )}
    </div>
  );
}
