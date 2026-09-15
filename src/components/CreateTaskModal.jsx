import { useState, useEffect } from 'react';

export default function CreateTaskModal({ columns = [], initialStatus = '', members = [], onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(initialStatus || columns[0]?.id || 'todo');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
    } else if (columns[0]?.id) {
      setStatus(columns[0].id);
    }
  }, [initialStatus, columns]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Task title is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const parsedLabels = labels
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      await onCreate({
        title: trimmedTitle,
        description,
        status: status || columns[0]?.id || 'todo',
        priority,
        assignee: assignee || null,
        dueDate: dueDate || null,
        labels: parsedLabels,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" onClick={onClose}>
      <div className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-100 p-5 dark:border-white/10">
          <h2 className="text-xl font-semibold">New Task</h2>
          <button type="button" className="btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block mb-1 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              className="input text-base font-medium"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Description
            </label>
            <textarea
              className="input min-h-24"
              placeholder="Add details, context, or instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-1 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Status
              </label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Priority
              </label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Assignee
              </label>
              <select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m._id || m.id} value={m._id || m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Due Date
              </label>
              <input
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Labels <span className="font-normal text-stone-400 lowercase">(comma-separated)</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. bug, frontend, design"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-white/10">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary min-w-24" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
