import React, { useState } from 'react';
import { X, Mail, MailOpen, ExternalLink, Inbox } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface MailboxProps {
  open: boolean;
  onClose: () => void;
  onProductClick: (productId: number) => void;
}

export default function Mailbox({ open, onClose, onProductClick }: MailboxProps) {
  const { state, dispatch, t } = useApp();
  const [selectedMail, setSelectedMail] = useState<string | null>(null);
  const isDark = state.theme === 'dark';

  if (!open) return null;

  const panelBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const divider = isDark ? 'border-slate-700' : 'border-slate-200';
  const hoverBg = isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50';
  const selectedBg = isDark ? 'bg-slate-800/80' : 'bg-cyan-50';

  const handleSelectMail = (id: string) => {
    setSelectedMail(id);
    const mail = state.mailbox.find(m => m.id === id);
    if (mail && !mail.read) {
      dispatch({ type: 'MARK_MAIL_READ', payload: id });
    }
  };

  const selected = state.mailbox.find(m => m.id === selectedMail);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-3xl h-[80vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${panelBg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${divider} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Inbox size={16} className="text-white" />
            </div>
            <div>
              <h2 className={`font-bold ${textColor}`}>{t('mailboxTitle')}</h2>
              <p className={`text-xs ${subText}`}>{state.mailbox.length} {state.language === 'en' ? 'messages' : state.language === 'be' ? 'лістоў' : 'сообщений'}</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Mail list */}
          <div className={`w-72 flex-shrink-0 border-r ${divider} overflow-y-auto`}>
            {state.mailbox.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                <Mail size={32} className={subText} />
                <p className={`text-sm ${subText}`}>
                  {state.language === 'ru' ? 'Нет сообщений' : state.language === 'be' ? 'Няма паведамленняў' : 'No messages'}
                </p>
              </div>
            ) : (
              state.mailbox.map(mail => (
                <button
                  key={mail.id}
                  onClick={() => handleSelectMail(mail.id)}
                  className={`w-full text-left px-4 py-3.5 border-b ${divider} transition-all duration-200 ${hoverBg} ${selectedMail === mail.id ? selectedBg : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-1">
                      {mail.read
                        ? <MailOpen size={14} className={subText} />
                        : <Mail size={14} className="text-cyan-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-semibold truncate ${mail.read ? subText : textColor}`}>{mail.subject}</p>
                        {!mail.read && <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${subText}`}>{mail.from}</p>
                      <p className={`text-xs mt-0.5 ${subText}`}>{new Date(mail.date).toLocaleString()}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Mail content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className={`w-16 h-16 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center`}>
                  <Mail size={28} className={subText} />
                </div>
                <p className={`text-sm ${subText}`}>
                  {state.language === 'ru' ? 'Выберите письмо' : state.language === 'be' ? 'Выберыце ліст' : 'Select a message'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in-up">
                {/* Email header */}
                <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <h3 className={`text-lg font-bold ${textColor}`}>{selected.subject}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium w-12 ${subText}`}>From:</span>
                      <span className={`text-xs ${textColor}`}>{selected.from}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium w-12 ${subText}`}>Date:</span>
                      <span className={`text-xs ${subText}`}>{new Date(selected.date).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Email body */}
                <div className={`rounded-xl border p-5 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                  {/* Weezly branding */}
                  <div className={`border-b pb-4 mb-4 ${divider}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">W</span>
                      </div>
                      <span className={`font-bold ${textColor}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>WEEZLY</span>
                    </div>
                  </div>

                  <div className={`text-sm leading-relaxed whitespace-pre-line ${textColor}`}>
                    {selected.body}
                  </div>

                  {selected.productId && (
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          const product = state.products.find(p => p.id === selected.productId);
                          if (product) onProductClick(product.id);
                          onClose();
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all duration-200"
                      >
                        <ExternalLink size={14} />
                        {t('viewProduct')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
