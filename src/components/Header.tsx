import { useState, useRef, useEffect } from 'react';
import {
  Search, ShoppingCart, Sun, Moon, Globe, ChevronDown,
  User, Shield, Settings, Mail, Zap, LogOut, LogIn, UserPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Language, Currency } from '../data/translations';

interface HeaderProps {
  onAdminClick: () => void;
  onMailboxClick: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onAuthClick: () => void;
}

export default function Header({ onAdminClick, onMailboxClick, searchQuery, setSearchQuery, onAuthClick }: HeaderProps) {
  const { state, dispatch, t } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isDark = state.theme === 'dark';

  const langOptions: { value: Language; label: string; flag: string }[] = [
    { value: 'ru', label: 'Русский', flag: '🇷🇺' },
    { value: 'be', label: 'Беларуская', flag: '🇧🇾' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
  ];

  const currentLang = langOptions.find(l => l.value === state.language);

  const headerBg = isDark
    ? 'bg-slate-900/80 border-slate-700/50'
    : 'bg-white/80 border-slate-200/50';

  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const dropdownBg = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const hoverBg = isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50';
  const inputBg = isDark ? 'bg-slate-800 border-slate-700 placeholder-slate-500 text-white' : 'bg-slate-100 border-slate-200 placeholder-slate-400 text-slate-900';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b ${headerBg} transition-all duration-300`}>
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse-glow">
              <Zap size={16} className="text-white" />
            </div>
            <span className={`text-xl font-bold tracking-tight ${textColor}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              WEEZLY
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl relative">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className={`w-full pl-9 pr-4 py-2 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${inputBg}`}
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Lang + Currency */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${hoverBg} ${textColor} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
              >
                <Globe size={14} className="text-cyan-500" />
                <span>{currentLang?.flag} {state.language.toUpperCase()}</span>
                <span className={`text-xs ${subText}`}>·</span>
                <span className="text-cyan-500 font-medium">{state.currency}</span>
                <ChevronDown size={12} className={`${subText} transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className={`absolute top-full right-0 mt-1 w-56 rounded-xl border shadow-2xl ${dropdownBg} animate-fade-in-up z-50`}>
                  <div className="p-2">
                    <div className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 ${subText}`}>Language</div>
                    {langOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { dispatch({ type: 'SET_LANGUAGE', payload: opt.value }); setLangOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${hoverBg} ${textColor} ${state.language === opt.value ? 'text-cyan-500 font-medium' : ''}`}
                      >
                        <span>{opt.flag}</span>
                        <span>{opt.label}</span>
                        {state.language === opt.value && <span className="ml-auto text-cyan-500">✓</span>}
                      </button>
                    ))}
                    <div className={`border-t mt-1 pt-1 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                      <div className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 ${subText}`}>Currency</div>
                      {(['BYN', 'USD'] as Currency[]).map(cur => (
                        <button
                          key={cur}
                          onClick={() => { dispatch({ type: 'SET_CURRENCY', payload: cur }); setLangOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${hoverBg} ${textColor} ${state.currency === cur ? 'text-cyan-500 font-medium' : ''}`}
                        >
                          <span className="w-6 text-center font-mono">{cur === 'USD' ? '$' : 'Br'}</span>
                          <span>{cur}</span>
                          {state.currency === cur && <span className="ml-auto text-cyan-500">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => dispatch({ type: 'SET_THEME', payload: isDark ? 'light' : 'dark' })}
              className={`p-2 rounded-xl transition-all duration-200 ${hoverBg} ${textColor} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
            </button>

            {/* Mailbox - only for logged in users */}
            {state.user && (
              <button
                onClick={onMailboxClick}
                className={`relative p-2 rounded-xl transition-all duration-200 ${hoverBg} ${textColor} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
              >
                <Mail size={16} />
                {state.unreadMail > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
                    {state.unreadMail}
                  </span>
                )}
              </button>
            )}

            {/* Admin panel button - only for admin */}
            {state.isAdmin && (
              <button
                onClick={onAdminClick}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-600 text-white transition-all duration-200 hover:from-amber-400 hover:to-orange-500"
              >
                <Settings size={14} />
                <span className="hidden md:block">{t('adminPanel')}</span>
              </button>
            )}

            {/* Auth buttons */}
            {state.user ? (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <User size={12} className="text-white" />
                  </div>
                  <span className={`text-sm font-medium ${textColor} hidden sm:block`}>{state.user.name}</span>
                </div>
                <button
                  onClick={() => dispatch({ type: 'LOGOUT' })}
                  className={`p-2 rounded-xl transition-all duration-200 ${hoverBg} ${textColor} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
                  title={t('logout')}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onAuthClick}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${isDark ? 'border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-400' : 'border-slate-200 text-slate-600 hover:border-cyan-400 hover:text-cyan-600'}`}
                >
                  <LogIn size={14} />
                  <span className="hidden sm:block">{t('login')}</span>
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_AUTH_MODAL_OPEN', payload: true })}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-all duration-200 hover:from-cyan-400 hover:to-blue-500"
                >
                  <UserPlus size={14} />
                  <span className="hidden sm:block">{t('register')}</span>
                </button>
              </div>
            )}

            {/* Cart - only for logged in users */}
            {state.user && (
              <button
                onClick={() => dispatch({ type: 'SET_CART_OPEN', payload: true })}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${hoverBg} ${textColor} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
              >
                <ShoppingCart size={16} />
                <span className="hidden sm:block">{t('cart')}</span>
                {state.cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {state.cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
