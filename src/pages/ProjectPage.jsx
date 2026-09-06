import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DndContext, closestCorners, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import api from '../lib/api.js';
import { loadProjects, loadTasks, loadWorkspace, upsertTask, removeTask } from '../store/dataSlice.js';
import { pushUndo, toggleSelected, clearSelected, setSelected } from '../store/uiSlice.js';
import { canEdit, canAdmin } from '../lib/utils.js';
import TaskModal from '../components/TaskModal.jsx';
import Confirm from '../components/Confirm.jsx';

export default function ProjectPage() {
  const { workspaceId, projectId } = useParams();
  const dispatch = useDispatch();
  const { current, tasks, subtasks, projects, loading } = useSelector((s) => s.data);
  const selected = useSelector((s) => s.ui.selectedTaskIds);
  const role = current?.myRole;
  const project = projects.find((p) => p._id === projectId);
  const [view, setView] = useState(project?.lastView || 'board');
  const [filters, setFilters] = useState({ assignee: '', priority: '', status: '', label: '', sort: 'order', q: '' });
  const [presets, setPresets] = useState([]);
  const [openTask, setOpenTask] = useState(null);
  const [groupBy, setGroupBy] = useState('none');
  const [confirm, setConfirm] = useState(null);
  const [activeDrag, setActiveDrag] = useState(null);

  useEffect(() => {
    dispatch(loadWorkspace(workspaceId));
    dispatch(loadProjects(workspaceId));
  }, [workspaceId, dispatch]);

  useEffect(() => {
    if (project?.lastView) setView(project.lastView);
  }, [project?._id, project?.lastView]);

  useEffect(() => {
    const params = {};
    if (filters.assignee) params.assignee = filters.assignee;
    if (filters.priority) params.priority = filters.priority;
    if (filters.status) params.status = filters.status;
    if (filters.label) params.label = filters.label;
    if (filters.sort) params.sort = filters.sort;
    if (filters.q) params.q = filters.q;
    dispatch(loadTasks({ projectId, params }));
  }, [projectId, filters, dispatch]);

  useEffect(() => {
    api.get(`/search/presets/${workspaceId}`, { params: { project: projectId } }).then((r) => setPresets(r.data));
  }, [workspaceId, projectId]);

  useEffect(() => {
    const onKey = async (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canEdit(role)) {
        e.preventDefault();
        await createTask();
      }
      if (e.key === '1') setViewAndPersist('board');
      if (e.key === '2') setViewAndPersist('list');
      if (e.key === '3') setViewAndPersist('calendar');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function setViewAndPersist(v) {
    setView(v);
    if (canEdit(role)) await api.patch(`/projects/${projectId}`, { lastView: v });
  }

  async function createTask(status) {
    const { data } = await api.post(`/tasks/project/${projectId}`, {
      title: 'New task',
      status: status || project?.columns?.[0]?.id,
    });
    dispatch(loadTasks({ projectId, params: filters }));
    setOpenTask(data._id);
    toast.success('Task created');
  }

  async function patchTask(id, patch, undoPatch) {
    dispatch(pushUndo({ id, undoPatch: undoPatch || patch }));
    const { data } = await api.patch(`/tasks/${id}`, patch);
    dispatch(upsertTask(data));
    dispatch(loadTasks({ projectId, params: filters }));
  }

  async function deleteTask(id) {
    const snap = tasks.find((t) => t._id === id);
    await api.delete(`/tasks/${id}`);
    dispatch(removeTask(id));
    toast('Task deleted', {
      action: {
        label: 'Undo',
        onClick: async () => {
          await api.post(`/tasks/project/${projectId}`, {
            title: snap.title,
            description: snap.description,
            status: snap.status,
            priority: snap.priority,
            dueDate: snap.dueDate,
            assignee: snap.assignee?._id || snap.assignee,
            labels: snap.labels,
          });
          dispatch(loadTasks({ projectId, params: filters }));
        },
      },
    });
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (!project) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">
            <span style={{ color: project.color }}>{project.icon}</span> {project.name}
          </h1>
          <p className="text-sm text-stone-500">{project.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['board', 'list', 'calendar'].map((v) => (
            <button key={v} className={view === v ? 'btn-primary capitalize' : 'btn-ghost capitalize'} onClick={() => setViewAndPersist(v)}>
              {v}
            </button>
          ))}
          {canEdit(role) && (
            <button className="btn-primary" onClick={() => createTask()}>
              New task
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input className="input w-40" placeholder="Search tasks" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <select className="input w-36" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">Priority</option>
          {['low', 'medium', 'high', 'urgent'].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select className="input w-36" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Status</option>
          {project.columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="input w-40" value={filters.assignee} onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}>
          <option value="">Assignee</option>
          {project.members?.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </select>
        <select className="input w-36" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
          <option value="order">Manual</option>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
          <option value="created">Created</option>
          <option value="alpha">A–Z</option>
        </select>
        {view === 'list' && (
          <select className="input w-36" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="none">No grouping</option>
            <option value="assignee">Assignee</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
            <option value="label">Label</option>
          </select>
        )}
        {canEdit(role) && (
          <button
            className="btn-ghost text-xs"
            onClick={async () => {
              const name = prompt('Preset name');
              if (!name) return;
              await api.post(`/search/presets/${workspaceId}`, { name, project: projectId, filters });
              const { data } = await api.get(`/search/presets/${workspaceId}`, { params: { project: projectId } });
              setPresets(data);
              toast.success('Filter saved');
            }}
          >
            Save filter
          </button>
        )}
        {presets.map((p) => (
          <button key={p._id} className="btn-ghost text-xs" onClick={() => setFilters({ ...filters, ...p.filters })}>
            {p.name}
          </button>
        ))}
      </div>

      {selected.length > 0 && canEdit(role) && (
        <div className="panel mt-3 flex flex-wrap items-center gap-2 p-2">
          <span className="px-2 text-sm">{selected.length} selected</span>
          <select
            className="input w-36"
            onChange={async (e) => {
              if (!e.target.value) return;
              await api.post('/tasks/bulk', { ids: selected, workspaceId, patch: { status: e.target.value } });
              dispatch(clearSelected());
              dispatch(loadTasks({ projectId, params: filters }));
            }}
          >
            <option value="">Change status</option>
            {project.columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="input w-40"
            onChange={async (e) => {
              if (!e.target.value) return;
              await api.post('/tasks/bulk', { ids: selected, workspaceId, patch: { assignee: e.target.value } });
              dispatch(clearSelected());
              dispatch(loadTasks({ projectId, params: filters }));
            }}
          >
            <option value="">Assign</option>
            {project.members?.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            className="btn-ghost text-red-600"
            onClick={() =>
              setConfirm({
                title: 'Delete selected tasks?',
                onYes: async () => {
                  await api.post('/tasks/bulk', { ids: selected, workspaceId, patch: { delete: true } });
                  dispatch(clearSelected());
                  dispatch(loadTasks({ projectId, params: filters }));
                },
              })
            }
          >
            Delete
          </button>
          <button className="btn-ghost" onClick={() => dispatch(clearSelected())}>
            Clear
          </button>
        </div>
      )}

      {loading && <div className="mt-6 grid grid-cols-4 gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-64" />)}</div>}

      {!loading && view === 'board' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e) => setActiveDrag(tasks.find((t) => t._id === e.active.id))}
          onDragEnd={async ({ active, over }) => {
            setActiveDrag(null);
            if (!over || !canEdit(role)) return;
            const col = project.columns.find((c) => c.id === over.id) || project.columns.find((c) => tasks.find((t) => t._id === over.id)?.status === c.id);
            const status = project.columns.find((c) => c.id === over.id)?.id || tasks.find((t) => t._id === over.id)?.status;
            if (status) await patchTask(active.id, { status });
          }}
        >
          <div className="mt-6 flex gap-4 overflow-x-auto pb-8">
            {project.columns
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((col) => (
                <KanbanCol
                  key={col.id}
                  col={col}
                  tasks={tasks.filter((t) => t.status === col.id)}
                  subtasks={subtasks}
                  onOpen={setOpenTask}
                  onCreate={() => createTask(col.id)}
                  canEdit={canEdit(role)}
                  selected={selected}
                  onToggle={(id) => dispatch(toggleSelected(id))}
                />
              ))}
            {canEdit(role) && (
              <button
                className="btn-ghost h-fit min-w-[160px]"
                onClick={async () => {
                  const name = prompt('Column name');
                  if (!name) return;
                  await api.post(`/projects/${projectId}/columns`, { name });
                  dispatch(loadProjects(workspaceId));
                }}
              >
                + Column
              </button>
            )}
          </div>
          <DragOverlay>
            {activeDrag ? (
              <div className="panel w-72 p-3 text-sm font-medium">{activeDrag.title}</div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {!loading && view === 'list' && (
        <TaskTable
          tasks={tasks}
          project={project}
          groupBy={groupBy}
          selected={selected}
          onToggle={(id) => dispatch(toggleSelected(id))}
          onOpen={setOpenTask}
        />
      )}

      {!loading && view === 'calendar' && <CalendarBoard tasks={tasks} onOpen={setOpenTask} />}

      {!loading && !tasks.length && (
        <div className="panel mt-8 p-12 text-center text-stone-500">No tasks match these filters.</div>
      )}

      {openTask && (
        <TaskModal
          taskId={openTask}
          onClose={() => {
            setOpenTask(null);
            dispatch(loadTasks({ projectId, params: filters }));
          }}
          onDelete={deleteTask}
        />
      )}
      {confirm && <Confirm {...confirm} onClose={() => setConfirm(null)} />}
    </div>
  );
}

function KanbanCol({ col, tasks, subtasks, onOpen, onCreate, canEdit, selected, onToggle }) {
  const { setNodeRef } = useDroppable({ id: col.id, data: { type: 'col' } });
  return (
    <div ref={setNodeRef} className="w-72 shrink-0 rounded-2xl bg-stone-100/80 p-2 dark:bg-white/5">
      <div className="flex items-center justify-between px-2 py-2 text-sm font-medium">
        <span>
          {col.name} <span className="text-stone-400">{tasks.length}</span>
        </span>
        {canEdit && (
          <button className="text-stone-400" onClick={onCreate}>
            +
          </button>
        )}
      </div>
      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((t) => (
            <TaskCard
              key={t._id}
              task={t}
              subs={subtasks.filter((s) => s.parent === t._id || s.parent?._id === t._id)}
              onOpen={onOpen}
              selected={selected.includes(t._id)}
              onToggle={onToggle}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function TaskCard({ task, subs, onOpen, selected, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`panel cursor-grab p-3 ${selected ? 'ring-2 ring-accent' : ''}`}>
      <div className="flex items-start gap-2">
        <input type="checkbox" checked={selected} onChange={() => onToggle(task._id)} onClick={(e) => e.stopPropagation()} />
        <button className="flex-1 text-left" onClick={() => onOpen(task._id)}>
          <div className="text-sm font-medium">{task.title}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${priCls(task.priority)}`}>{task.priority}</span>
            {task.labels?.map((l) => (
              <span key={l} className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] dark:bg-white/10">
                {l}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
            <span>{task.assignee?.name || 'Unassigned'}</span>
            <span>{task.dueDate ? format(new Date(task.dueDate), 'MMM d') : ''}</span>
          </div>
          {!!subs.length && (
            <div className="mt-2 text-[11px] text-stone-400">
              {subs.filter((s) => s.completed).length}/{subs.length} subtasks
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

function TaskTable({ tasks, project, groupBy, selected, onToggle, onOpen }) {
  const groups = useMemo(() => {
    if (groupBy === 'none') return { All: tasks };
    const map = {};
    for (const t of tasks) {
      let key = 'None';
      if (groupBy === 'assignee') key = t.assignee?.name || 'Unassigned';
      if (groupBy === 'status') key = project.columns.find((c) => c.id === t.status)?.name || t.status;
      if (groupBy === 'priority') key = t.priority;
      if (groupBy === 'label') key = t.labels?.[0] || 'No label';
      map[key] = map[key] || [];
      map[key].push(t);
    }
    return map;
  }, [tasks, groupBy, project]);

  return (
    <div className="mt-6 space-y-6">
      {Object.entries(groups).map(([g, list]) => (
        <div key={g} className="panel overflow-hidden">
          <div className="border-b border-stone-100 px-4 py-2 text-xs font-medium uppercase tracking-wide text-stone-400 dark:border-white/10">
            {g}
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-stone-400">
              <tr>
                <th className="p-3 w-8" />
                <th className="p-3">Title</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Assignee</th>
                <th className="p-3">Due</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t._id} className="border-t border-stone-100 hover:bg-stone-50 dark:border-white/5 dark:hover:bg-white/5">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.includes(t._id)} onChange={() => onToggle(t._id)} />
                  </td>
                  <td className="p-3">
                    <button className="font-medium" onClick={() => onOpen(t._id)}>
                      {t.title}
                    </button>
                  </td>
                  <td className="p-3 capitalize">{project.columns.find((c) => c.id === t.status)?.name}</td>
                  <td className="p-3 capitalize">{t.priority}</td>
                  <td className="p-3">{t.assignee?.name || '—'}</td>
                  <td className="p-3">{t.dueDate ? format(new Date(t.dueDate), 'MMM d') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function CalendarBoard({ tasks, onOpen }) {
  const now = new Date();
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(now)),
    end: endOfWeek(endOfMonth(now)),
  });
  return (
    <div className="mt-6 grid grid-cols-7 gap-2">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
        <div key={d} className="text-center text-[11px] uppercase tracking-wide text-stone-400">
          {d}
        </div>
      ))}
      {days.map((d) => {
        const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), d));
        return (
          <div key={d.toISOString()} className="panel min-h-[110px] p-2">
            <div className="text-xs text-stone-400">{format(d, 'd')}</div>
            {dayTasks.map((t) => (
              <button key={t._id} className="mt-1 block w-full truncate rounded-md bg-accent/10 px-1 text-left text-[11px]" onClick={() => onOpen(t._id)}>
                {t.title}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function priCls(p) {
  if (p === 'urgent') return 'bg-red-100 text-red-700';
  if (p === 'high') return 'bg-orange-100 text-orange-700';
  if (p === 'low') return 'bg-stone-100 text-stone-600';
  return 'bg-amber-100 text-amber-800';
}
