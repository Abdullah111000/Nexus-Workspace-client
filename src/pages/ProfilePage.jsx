import { useDispatch, useSelector } from 'react-redux';
import { updateMe } from '../store/authSlice.js';
import { toast } from 'sonner';

export default function ProfilePage() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-4xl">Profile</h1>
      <form
        className="panel mt-6 space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          await dispatch(
            updateMe({
              name: fd.get('name'),
              avatar: fd.get('avatar'),
              defaultView: fd.get('defaultView'),
            })
          );
          toast.success('Profile saved');
        }}
      >
        <label className="text-xs uppercase text-stone-400">Name</label>
        <input className="input" name="name" defaultValue={user.name} />
        <label className="text-xs uppercase text-stone-400">Email</label>
        <input className="input" value={user.email} disabled />
        <label className="text-xs uppercase text-stone-400">Avatar URL</label>
        <input className="input" name="avatar" defaultValue={user.avatar} placeholder="https://…" />
        <label className="text-xs uppercase text-stone-400">Default view</label>
        <select className="input" name="defaultView" defaultValue={user.defaultView}>
          <option value="board">Board</option>
          <option value="list">List</option>
          <option value="calendar">Calendar</option>
        </select>
        <button className="btn-primary">Save</button>
      </form>
      <p className="mt-4 text-sm text-stone-500">
        Switch accounts by logging out and signing in as owner@, admin@, member@, or viewer@demo.com.
      </p>
    </div>
  );
}
