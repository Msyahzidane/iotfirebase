import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Power, Mail, KeyRound } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      setError('Gagal login: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError('Gagal login dengan Google: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Power className="h-24 w-24 -mt-8 -mr-8" />
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-white/10 mb-4 backdrop-blur-sm border border-white/20 shadow-inner">
            <Power className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">DANE-27E94 <span className="font-light">CORE</span></h2>
          <p className="text-indigo-100 text-xs font-mono tracking-widest uppercase">Secure Access Portal</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-lg mb-6 border border-red-500/30 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-600" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-white placeholder-slate-700"
                  placeholder="admin@domain.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-600" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-white placeholder-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-1 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-500 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>AUTHENTICATING...</span>
                </>
              ) : 'INITIALIZE UPLINK'}
            </button>
          </form>

          <div className="mt-8 flex items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="px-4 text-[10px] font-mono tracking-widest uppercase text-slate-600">Secure OAuth</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-6 w-full flex justify-center items-center gap-3 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-medium py-3 px-4 rounded-lg transition-colors focus:ring-1 focus:ring-offset-1 focus:ring-slate-500 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider text-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Connect via Google
          </button>
        </div>
      </div>
    </div>
  );
}
