import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signup } from '../store/authSlice.js';

export default function Signup() {
  const dispatch = useDispatch();
  const error = useSelector((s) => s.auth.error);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-6 dark:bg-ink-950">
      <form
        className="panel w-full max-w-md p-8"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch(signup({ name, email, password }));
        }}
      >
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Nexus</p>
        <h1 className="mt-2 font-display text-3xl">Create your account</h1>
        <label className="mt-6 block text-xs font-medium uppercase tracking-wide text-stone-500">Name</label>
        <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-stone-500">Email</label>
        <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-stone-500">Password</label>
        <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button className="btn-primary mt-6 w-full" type="submit">
          Sign up
        </button>
        <p className="mt-4 text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link className="text-accent" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
