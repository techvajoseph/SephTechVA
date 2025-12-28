
import React, { useState } from 'react';
import { Role, User } from '../types';
import { Lock, User as UserIcon, ShieldAlert } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mock Authentication Logic
    if (id === 'admin' && password === 'admin') {
      onLogin({ id: 'ADM001', name: 'System Admin', role: Role.ADMIN, assignedSites: [] });
    } else if (id === 'tk01' && password === 'password') {
      onLogin({ id: 'TK001', name: 'Robert Smith', role: Role.TIMEKEEPER, assignedSites: ['S001', 'S002'] });
    } else {
      setError('Invalid ID or Password. Contact Admin if forgotten.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-blue-600/20 mb-6">
            <ShieldAlert size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SiteScan Pro</h1>
          <p className="text-slate-400">Attendance & Compliance Management</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden p-8 md:p-10">
          <h2 className="text-xl font-bold mb-8 text-slate-800">Authorized Personnel Only</h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Employee ID</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={id}
                  onChange={e => setId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  placeholder="Enter ID"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Access Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                <ShieldAlert size={16} />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
            >
              Sign In to System
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
            <p>v2.4 Enterprise</p>
            <p>© 2024 SiteScan Solutions</p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-slate-500 text-xs">
          <p>Demo accounts: tk01 / password (Timekeeper)</p>
          <p className="mt-1">admin / admin (Administrator)</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
