import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { loadNotifications } from '../store/dataSlice.js';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications({ count }) {
  const [open, setOpen] = useState(false);
  const items = useSelector((s) => s.data.notifications.items);
  const current = useSelector((s) => s.data.current);
  const dispatch = useDispatch();
  const nav = useNavigate();

  return (
    <div className="relative">
      <button className="btn-ghost relative px-2" onClick={() => setOpen((v) => !v)}>
        <Bell size={16} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] text-white">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="panel absolute right-0 top-11 z-40 w-80 p-2">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-sm font-medium">Notifications</span>
            <button
              className="text-xs text-accent"
              onClick={async () => {
                await api.post('/notifications/read-all');
                dispatch(loadNotifications());
              }}
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-auto">
            {!items.length && <p className="px-2 py-6 text-center text-xs text-stone-400">You are all caught up.</p>}
            {items.map((n) => (
              <button
                key={n._id}
                className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm ${n.read ? 'opacity-60' : 'bg-stone-50 dark:bg-white/5'}`}
                onClick={async () => {
                  await api.patch(`/notifications/${n._id}`, { read: true });
                  dispatch(loadNotifications());
                  if (n.project && current) nav(`/w/${n.workspace || current._id}/p/${n.project}`);
                  setOpen(false);
                }}
              >
                <div className="font-medium">{n.title}</div>
                <div className="text-xs text-stone-500">{n.body}</div>
                <div className="mt-1 text-[10px] text-stone-400">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
