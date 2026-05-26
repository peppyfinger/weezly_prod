import { useState } from 'react';
import { X, User, Mail, Lock, ArrowRight, UserPlus, Key, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { forgotPassword } from '../api';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { state, dispatch, t } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
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

    if (mode === 'forgot') {
      try {
        const result = await forgotPassword(email, state.language);
        if (result.success) {
          setResetSent(true);
        } else {
          setError(result.error || t('loginError'));
        }
      } catch (err) {
        setError('Network error');
      }
      setLoading(false);
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError(t('passwordMismatch'));
        setLoading(false);
        return;
      }
      if (password.length < 4) {
        setError(state.language === 'ru' ? 'Пароль слишком короткий' : state.language === 'be' ? 'Пароль занадта кароткі' : 'Password too short');
        setLoading(false);
        return;
      }
      dispatch({ type: 'LOGIN_USER', payload: { name: name || email.split('@')[0], email } });
      resetAndClose();
    } else {
      if (email && password) {
        dispatch({ type: 'LOGIN_USER', payload: { name: email.split('@')[0], email } });
        resetAndClose();
      } else {
        setError(t('loginError'));
      }
    }
    setLoading(false);
  };

  const resetAndClose = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setResetSent(false);
    setMode('login');
    onClose();
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setError('');
    setResetSent(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${cardBg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              {mode === 'forgot' ? <Key size={18} className="text-white" /> : mode === 'login' ? <User size={18} className="text-white" /> : <UserPlus size={18} className="text-white" />}
            </div>
            <div>
              <h2 className={`font-bold ${textColor}`}>
                {mode === 'forgot' ? (state.language === 'ru' ? 'Восстановление пароля' : state.language === 'be' ? 'Аднаўленне пароля' : 'Password Recovery')
                  : mode === 'login' ? t('loginTitle') : t('registerTitle')}
              </h2>
              <p className={`text-xs ${subText}`}>WEEZLY Platform</p>
            </div>
          </div>
          <button onClick={resetAndClose} className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={18} />
          </button>
        </div>

        {resetSent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Mail size={24} className="text-emerald-500" />
            </div>
            <h3 className={`text-lg font-bold ${textColor} mb-2`}>
              {state.language === 'ru' ? 'Письмо отправлено!' : state.language === 'be' ? 'Ліст адпраўлены!' : 'Email sent!'}
            </h3>
            <p className={`text-sm ${subText}`}>
              {state.language === 'ru' ? `Код подтверждения отправлен на ${email}` :
                state.language === 'be' ? `Код пацверджання адпраўлены на ${email}` :
                `Reset code sent to ${email}`}
            </p>
            <button
              onClick={() => { setResetSent(false); setMode('login'); }}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
            >
              {t('loginButton')}
            </button>
          </div>
        ) : (
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

            {mode !== 'forgot' && (
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
                  />
                </div>
              </div>
            )}

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
                  {mode === 'forgot' ? (state.language === 'ru' ? 'Отправить код' : state.language === 'be' ? 'Адправіць код' : 'Send Code') :
                    mode === 'login' ? t('loginButton') : t('registerButton')}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className={`w-full text-sm ${subText} hover:text-cyan-500 transition-colors`}
              >
                {state.language === 'ru' ? 'Забыли пароль?' : state.language === 'be' ? 'Забылі пароль?' : 'Forgot password?'}
              </button>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className={`text-sm ${subText} hover:text-cyan-500 transition-colors`}
              >
                {mode === 'forgot' ? t('hasAccount') :
                  mode === 'login' ? t('noAccount') : t('hasAccount')}{' '}
                <span className="text-cyan-500 font-medium">
                  {mode === 'forgot' ? t('login') :
                    mode === 'login' ? t('register') : t('login')}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
