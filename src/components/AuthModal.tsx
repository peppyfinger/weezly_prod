import { useState } from 'react';
import { X, User, Mail, Lock, ArrowRight, UserPlus, Key, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { state, t, loginUser, registerUser } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isDark = state.theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError(state.language === 'ru' ? 'Пароли не совпадают' : state.language === 'be' ? 'Паролі не супадаюць' : 'Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError(state.language === 'ru' ? 'Пароль должен быть не менее 6 символов' : state.language === 'be' ? 'Пароль павінен быць не менш за 6 сімвалаў' : 'Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const result = await registerUser(email, password, name || email.split('@')[0]);
        if (result.success) {
          resetAndClose();
        } else {
          setError(result.error || 'Registration failed');
        }
      } else {
        if (!email || !password) {
          setError(state.language === 'ru' ? 'Введите email и пароль' : state.language === 'be' ? 'Увядзіце email і пароль' : 'Enter email and password');
          setLoading(false);
          return;
        }
        const result = await loginUser(email, password);
        if (result.success) {
          resetAndClose();
        } else {
          setError(result.error || 'Login failed');
        }
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const resetAndClose = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setMode('login');
    onClose();
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${cardBg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              {mode === 'login' ? <User size={18} className="text-white" /> : <UserPlus size={18} className="text-white" />}
            </div>
            <div>
              <h2 className={`font-bold ${textColor}`}>
                {mode === 'login' ? t('loginTitle') : t('registerTitle')}
              </h2>
              <p className={`text-xs ${subText}`}>WEEZLY Platform</p>
            </div>
          </div>
          <button onClick={resetAndClose} className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${subText}`}>{t('nameLabel')}</label>
              <div className="relative">
                <User size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText}`} />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('yourName')}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${inputBg}`}
                />
              </div>
            </div>
          )}

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${subText}`}>{t('emailLabel')}</label>
            <div className="relative">
              <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText}`} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${inputBg}`}
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${subText}`}>{t('passwordLabel')}</label>
            <div className="relative">
              <Lock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText}`} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${inputBg}`}
                required
                minLength={6}
              />
            </div>
            {mode === 'register' && (
              <p className={`text-xs mt-1 ${subText}`}>
                {state.language === 'ru' ? 'Минимум 6 символов' : state.language === 'be' ? 'Мінімум 6 сімвалаў' : 'Minimum 6 characters'}
              </p>
            )}
          </div>

          {mode === 'register' && (
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${subText}`}>{t('confirmPasswordLabel')}</label>
              <div className="relative">
                <Lock size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText}`} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${inputBg}`}
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          {error && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              <span className="text-xs">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-all duration-200 hover:from-cyan-400 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <>
                {mode === 'login' ? t('loginButton') : t('registerButton')}
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className={`text-sm ${subText} hover:text-cyan-500 transition-colors`}
            >
              {mode === 'login' ? t('noAccount') : t('hasAccount')}{' '}
              <span className="text-cyan-500 font-medium">
                {mode === 'login' ? t('register') : t('login')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
