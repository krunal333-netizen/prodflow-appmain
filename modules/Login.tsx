
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/UI';
import { Lock, User, Loader2, Sparkles, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const Login: React.FC = () => {
  const { login, emergencySignUp, theme } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (e: any) {
      console.error("Login attempt failed:", e);
      let msg = 'Login failed. Please check your credentials.';
      if (e.code === 'auth/invalid-credential') {
        msg = 'Incorrect username or password.';
      } else if (e.code === 'auth/user-not-found') {
        msg = 'Account not found. Use "Setup Admin Account" if this is your first time.';
      } else if (e.message) {
        msg = e.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupAdmin = async () => {
    setSetupLoading(true);
    setError('');
    try {
      await emergencySignUp({
        id: uuidv4(),
        username: 'admin',
        name: 'Initial Admin',
        role: 'ADMIN'
      }, 'password123');
      
      await login('admin', 'password123');
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use' || e.message?.includes('already-in-use')) {
        setError('Admin account already exists. Use username: admin, password: password123');
      } else {
        setError('Setup failed: ' + (e.message || 'Unknown error'));
      }
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lightBg dark:bg-navy-900 flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-500">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-lightPrimary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />

      <div className="max-w-[420px] w-full z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center justify-center gap-4 mb-10">
          <div className="h-20 w-full flex items-center justify-center">
             <img 
               src={theme === 'light' ? 'logo-light-mode.png' : 'logo-dark-mode.png'} 
               alt="ProdFlow Logo" 
               className="h-full w-auto object-contain block mx-auto transition-all duration-300"
               loading="eager"
             />
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-lightBorder dark:border-white/10 p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-lightText dark:text-white mb-2 font-display">Welcome Back</h2>
              <p className="text-lightTextSecondary text-sm font-medium">Enter credentials to access the studio manager.</p>
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 flex items-start gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lightTextSecondary group-focus-within:text-lightPrimary transition-colors">
                  <User size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full h-12 pl-12 pr-4 bg-white dark:bg-navy-900 border border-lightBorder dark:border-navy-700 rounded-lg focus:ring-2 focus:ring-lightPrimary/50 focus:border-lightPrimary focus:outline-none text-lightText dark:text-white font-bold transition-all placeholder:text-lightTextSecondary/50 text-sm"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lightTextSecondary group-focus-within:text-lightPrimary transition-colors">
                  <Lock size={18} strokeWidth={2.5} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full h-12 pl-12 pr-12 bg-white dark:bg-navy-900 border border-lightBorder dark:border-navy-700 rounded-lg focus:ring-2 focus:ring-lightPrimary/50 focus:border-lightPrimary focus:outline-none text-lightText dark:text-white font-bold transition-all placeholder:text-lightTextSecondary/50 text-sm"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-lightTextSecondary hover:text-lightPrimary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full h-12 bg-lightPrimary hover:bg-lightPrimaryHover text-white rounded-lg font-bold text-sm shadow-xl shadow-lightPrimary/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              disabled={loading || setupLoading}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Sign In <ArrowRight size={16} strokeWidth={3} /></>
              )}
            </button>
            
            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-lightBorder dark:bg-white/5 flex-1" />
              <span className="text-[10px] font-black text-lightTextSecondary uppercase tracking-widest">Setup</span>
              <div className="h-px bg-lightBorder dark:bg-white/5 flex-1" />
            </div>

            <button 
              type="button"
              onClick={handleSetupAdmin}
              disabled={loading || setupLoading}
              className="w-full py-4 text-[11px] font-black text-lightTextSecondary hover:text-lightText dark:hover:text-white uppercase tracking-widest border border-lightBorder dark:border-white/5 rounded-lg hover:bg-lightBgSecondary dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              {setupLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} className="text-amber-400" />}
              Setup Admin Account
            </button>
          </form>
        </div>
        <p className="mt-8 text-center text-[10px] font-bold text-lightTextSecondary uppercase tracking-[0.2em]">
          &copy; 2025 ProdFlow Systems &bull; v1.0.5
        </p>
      </div>
    </div>
  );
};
