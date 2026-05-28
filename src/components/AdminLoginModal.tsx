import { useState } from 'react';
import { X, Shield, Lock, User, AlertCircle, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
  const { state, t, loginAdmin } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputCls = 'w-full px-4 py-3 rounded-xl border bg-slate-800 border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50';

  if (!open) return null;

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const result = await loginAdmin(username, password);
    if (result.success) {
      setUsername('');
      setPassword('');
      onClose();
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border bg-slate-900 border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">{t('adminLogin')}</h2>
              <p className="text-xs text-slate-400">{t('adminLoginDesc')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-all duration-200">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Demo credentials hint */}
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <p className="text-xs font-semibold text-cyan-400 mb-1">{t('demoCredentials')}:</p>
            <div className="space-y-0.5">
              <div className="flex justify-between text-xs"><span className="text-slate-400">Login:</span><code className="text-cyan-300 font-mono">admin</code></div>
              <div className="flex justify-between text-xs"><span className="text-slate-400">Password:</span><code className="text-cyan-300 font-mono">admin123</code></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className={inputCls}
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Login"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                className={inputCls}
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle size={12} />
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : t('loginButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
