import React from 'react';
import { CheckCircle, AlertCircle, Info, X, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Notifications() {
  const { state, dispatch } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {state.toasts.map(toast => (
        <div
          key={toast.id}
          className="animate-toast-in pointer-events-auto"
        >
          <div className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-2xl border min-w-[280px] max-w-sm backdrop-blur-xl ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30'
              : toast.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/30'
              : toast.type === 'error'
              ? 'bg-red-950/90 border-red-500/30'
              : 'bg-slate-900/90 border-slate-700/50'
          }`}>
            <div className={`flex-shrink-0 mt-0.5 ${
              toast.type === 'success' ? 'text-emerald-400' :
              toast.type === 'warning' ? 'text-amber-400' :
              toast.type === 'error' ? 'text-red-400' :
              'text-cyan-400'
            }`}>
              {toast.type === 'success' ? <CheckCircle size={18} /> :
               toast.type === 'warning' ? <Bell size={18} /> :
               toast.type === 'error' ? <AlertCircle size={18} /> :
               <Info size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{toast.title}</p>
              <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
              className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
