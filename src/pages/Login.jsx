import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/authSlice.js';

export default function Login() {
  const dispatch = useDispatch();
  const error = useSelector((s) => s.auth.error);
  const [email, setEmail] = useState('owner@demo.com');
  const [password, setPassword] = useState('password123');

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-50 dark:bg-ink-950">
      <div className="grain pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply dark:mix-blend-overlay" />
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Nexus workspace</p>
          <h1 className="font-display mt-4 text-5xl leading-tight text-ink-900 dark:text-ink-50">
            Plans, people, and progress — in one calm room.
          </h1>
          <p className="mt-4 max-w-md text-stone-600 dark:text-stone-400">
            A MERN workspace for teams: boards, lists, calendar, comments, roles, and a live activity stream.
          </p>
          <div className="mt-8 grid max-w-md gap-2 text-sm text-stone-500">
            <span>Demo · owner@demo.com / password123</span>
            <span>Also: admin@ · member@ · viewer@demo.com</span>
          </div>
        </div>
        <form
          className="panel mx-auto w-full max-w-md p-8"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch(login({ email, password }));
          }}
        >
          <h2 className="text-lg font-semibold">Sign in</h2>
          <label className="mt-6 block text-xs font-medium uppercase tracking-wide text-stone-500">Email</label>
          <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-stone-500">Password</label>
          <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button className="btn-primary mt-6 w-full" type="submit">
            Enter workspace
          </button>
          <p className="mt-4 text-center text-sm text-stone-500">
            New here?{' '}
            <Link className="text-accent" to="/signup">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
