
import React, { useState } from 'react';
import { AuthService, isSupabaseConnected } from '../services/backend';
import { Logo } from '../components/Logo';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await AuthService.login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Professional Dark Gradient Background
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      <div className="w-full max-w-md glassmorphism rounded-3xl shadow-2xl p-8 space-y-8 relative z-20 border border-white/10 backdrop-blur-xl">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4 transform hover:scale-105 transition-transform duration-300 drop-shadow-2xl">
             <Logo className="h-20 scale-110" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-xs uppercase tracking-widest font-bold">Secure Staff Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="bg-red-500/10 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-sm text-center border border-red-500/20 font-bold">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner font-medium"
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-inner font-medium"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500 space-y-3 border-t border-slate-200 dark:border-slate-700 pt-6">
          <p className="font-semibold">Authorized Access Only</p>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isSupabaseConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            {isSupabaseConnected ? '● Live System' : '● Offline Mode'}
          </div>
        </div>
      </div>
    </div>
  );
};
