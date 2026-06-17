/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-slate-950 text-indigo-500 font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-current border-t-transparent shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
        <div className="text-xs font-mono uppercase tracking-widest text-slate-500 animate-pulse">Initializing Core...</div>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased bg-slate-950">
      {user ? <Dashboard /> : <Login />}
    </div>
  );
}
