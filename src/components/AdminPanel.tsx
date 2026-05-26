import { useState, useEffect } from 'react';
import {
  X, BarChart3, Package, ShoppingBag, TrendingUp, Database,
  Cpu, Plus, Pencil, Trash2, LogOut,
  Users, DollarSign, ArrowUpRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, Category } from '../data/products';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

type Tab = 'dashboard' | 'products' | 'orders' | 'analytics' | 'infrastructure';

function MiniLineChart({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200;
  const h = height;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={data.length > 1 ? w : 0} cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2} r="3" fill={color} />
    </svg>
  );
}

function BarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all duration-700"
            style={{ height: `${(v / max) * 80}px`, backgroundColor: color, opacity: 0.85 }}
          />
          <span className="text-[9px] text-slate-500">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function InfraGauge({ value, max, label, sublabel, color }: { value: number; max: number; label: string; sublabel: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}{sublabel}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function AnimatedNumber({ target }: { target: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const step = target / 40;
    let curr = 0;
    const interval = setInterval(() => {
      curr = Math.min(curr + step, target);
      setCurrent(Math.round(curr));
      if (curr >= target) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [target]);
  return <>{current.toLocaleString()}</>;
}

export default function AdminPanel({ open, onClose }: AdminPanelProps) {
  const { state, dispatch, t, formatPrice } = useApp();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Infra live data
  const [dbConns, setDbConns] = useState(12);
  const [cacheHit, setCacheHit] = useState(87.3);
  const [queueSize, setQueueSize] = useState(4);
  const [dbHistory, setDbHistory] = useState([8, 10, 12, 9, 14, 12, 11, 13, 12]);
  const [cacheHistory, setCacheHistory] = useState([82, 84, 85, 87, 86, 88, 87, 89, 87]);
  const [queueHistory, setQueueHistory] = useState([2, 5, 3, 4, 6, 4, 3, 5, 4]);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setDbConns(v => { const n = Math.max(5, Math.min(25, v + Math.floor(Math.random() * 5) - 2)); setDbHistory(h => [...h.slice(-8), n]); return n; });
      setCacheHit(v => { const n = Math.max(70, Math.min(99, +(v + (Math.random() * 2 - 1)).toFixed(1))); setCacheHistory(h => [...h.slice(-8), n]); return n; });
      setQueueSize(v => { const n = Math.max(0, Math.min(15, v + Math.floor(Math.random() * 4) - 2)); setQueueHistory(h => [...h.slice(-8), n]); return n; });
    }, 2500);
    return () => clearInterval(interval);
  }, [open]);

  // Sales data
  const months = state.language === 'ru' ? ['Янв','Фев','Мар','Апр','Май','Июн','Июл'] :
    state.language === 'be' ? ['Сту','Лют','Сак','Кра','Май','Чэр','Ліп'] :
    ['Jan','Feb','Mar','Apr','May','Jun','Jul'];
  const salesData = [42000, 58000, 51000, 73000, 65000, 89000, 94000];
  const decisionData = [4.8, 4.2, 3.9, 3.5, 3.1, 2.8, 2.4];

  const totalRevenue = state.orders.reduce((s, o) => s + o.total, 0) + 284000;
  const totalOrders = state.orders.length + 1847;

  const handleDeleteProduct = (id: number) => {
    if (confirm('Delete product?')) dispatch({ type: 'DELETE_PRODUCT', payload: id });
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    onClose();
  };

  const emptyProduct: Partial<Product> = {
    nameRu: '', nameBe: '', nameEn: '', descRu: '', descBe: '', descEn: '',
    price: 0, category: 'laptops', brand: '', rating: 4.5, reviewCount: 0,
    stock: 10, image: '', tags: [], specs: {}, mtbf: 50000,
  };

  const [productForm, setProductForm] = useState<Partial<Product>>(emptyProduct);

  const openEdit = (p: Product) => { setEditingProduct(p); setProductForm(p); setIsAdding(false); };
  const openAdd = () => { setEditingProduct(null); setProductForm({ ...emptyProduct, id: Date.now() }); setIsAdding(true); };

  const handleSaveProduct = () => {
    if (isAdding) {
      dispatch({ type: 'ADD_PRODUCT', payload: productForm as Product });
    } else if (editingProduct) {
      dispatch({ type: 'UPDATE_PRODUCT', payload: { ...editingProduct, ...productForm } as Product });
    }
    setEditingProduct(null);
    setIsAdding(false);
  };

  if (!open) return null;

  const panelBg = 'bg-slate-950';
  const cardBg = 'bg-slate-900 border-slate-800';
  const textColor = 'text-white';
  const subText = 'text-slate-400';
  const divider = 'border-slate-800';
  const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50';

  const tabs: { value: Tab; icon: React.ReactNode; labelKey: string }[] = [
    { value: 'dashboard', icon: <BarChart3 size={15} />, labelKey: 'dashboard' },
    { value: 'products', icon: <Package size={15} />, labelKey: 'products_mgmt' },
    { value: 'orders', icon: <ShoppingBag size={15} />, labelKey: 'orders' },
    { value: 'analytics', icon: <TrendingUp size={15} />, labelKey: 'analytics' },
    { value: 'infrastructure', icon: <Cpu size={15} />, labelKey: 'infrastructure' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-stretch">
      <div className={`w-full max-w-5xl mx-auto flex flex-col ${panelBg} shadow-2xl`}>
        {/* Top bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Database size={15} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>WEEZLY Admin</span>
            <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">● Live</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 transition-all duration-200">
              <LogOut size={12} /> {t('logout')}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-all duration-200">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className={`w-48 flex-shrink-0 border-r ${divider} flex flex-col py-4`}>
            {tabs.map(tab_ => (
              <button
                key={tab_.value}
                onClick={() => setTab(tab_.value)}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm transition-all duration-200 ${
                  tab === tab_.value
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab_.icon}
                {t(tab_.labelKey as any)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Dashboard */}
            {tab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className={`text-xl font-bold ${textColor}`}>{t('dashboard')}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: t('totalRevenue'), value: <><AnimatedNumber target={totalRevenue} /> {state.currency}</>, icon: <DollarSign size={18} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
                    { label: t('totalOrders'), value: <AnimatedNumber target={totalOrders} />, icon: <ShoppingBag size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                    { label: t('activeUsers'), value: <AnimatedNumber target={2847} />, icon: <Users size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    { label: t('conversionRate'), value: '3.7%', icon: <TrendingUp size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                  ].map((stat, i) => (
                    <div key={i} className={`rounded-2xl border p-4 ${cardBg}`}>
                      <div className={`w-10 h-10 rounded-xl ${stat.bg} border flex items-center justify-center mb-3 ${stat.color}`}>
                        {stat.icon}
                      </div>
                      <p className={`text-sm ${subText}`}>{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className={`rounded-2xl border p-5 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold ${textColor}`}>{t('salesChart')}</h3>
                    <span className="text-xs text-emerald-400 flex items-center gap-1"><ArrowUpRight size={12} /> +18.2%</span>
                  </div>
                  <BarChart data={salesData} labels={months} color="#06b6d4" />
                </div>
              </div>
            )}

            {/* Products */}
            {tab === 'products' && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-bold ${textColor}`}>{t('products_mgmt')}</h2>
                  <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all duration-200"
                  >
                    <Plus size={14} /> {t('addProduct')}
                  </button>
                </div>

                {(editingProduct || isAdding) && (
                  <div className={`rounded-2xl border p-4 ${cardBg} space-y-3 animate-fade-in-up`}>
                    <h3 className={`font-semibold ${textColor}`}>{isAdding ? t('addProduct') : t('editProduct')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input className={inputCls} placeholder="Name (RU)" value={productForm.nameRu || ''} onChange={e => setProductForm(f => ({ ...f, nameRu: e.target.value }))} />
                      <input className={inputCls} placeholder="Name (EN)" value={productForm.nameEn || ''} onChange={e => setProductForm(f => ({ ...f, nameEn: e.target.value }))} />
                      <input className={inputCls} placeholder="Brand" value={productForm.brand || ''} onChange={e => setProductForm(f => ({ ...f, brand: e.target.value }))} />
                      <input type="number" className={inputCls} placeholder="Price (USD)" value={productForm.price || ''} onChange={e => setProductForm(f => ({ ...f, price: +e.target.value }))} />
                      <input type="number" className={inputCls} placeholder="Stock" value={productForm.stock || ''} onChange={e => setProductForm(f => ({ ...f, stock: +e.target.value }))} />
                      <select className={inputCls} value={productForm.category || 'laptops'} onChange={e => setProductForm(f => ({ ...f, category: e.target.value as Category }))}>
                        {['laptops','smartphones','smarthome','tablets','accessories'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input className={`${inputCls} col-span-2`} placeholder="Image URL" value={productForm.image || ''} onChange={e => setProductForm(f => ({ ...f, image: e.target.value }))} />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setEditingProduct(null); setIsAdding(false); }} className="px-4 py-2 rounded-xl text-sm border border-slate-700 text-slate-400 hover:border-slate-500 transition-all duration-200">{t('cancel')}</button>
                      <button onClick={handleSaveProduct} className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-400 transition-all duration-200">{t('save')}</button>
                    </div>
                  </div>
                )}

                <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                  <table className="w-full text-sm">
                    <thead className={`border-b ${divider}`}>
                      <tr>
                        {[t('name'), t('brandLabel'), t('price'), t('category'), t('stock'), t('actions')].map(h => (
                          <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${subText}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.products.map(p => (
                        <tr key={p.id} className={`border-b ${divider} hover:bg-slate-800/50 transition-colors`}>
                          <td className={`px-4 py-3 font-medium ${textColor} max-w-[200px] truncate`}>{p.nameEn}</td>
                          <td className={`px-4 py-3 ${subText}`}>{p.brand}</td>
                          <td className="px-4 py-3 text-cyan-400 font-medium">{formatPrice(p.price)}</td>
                          <td className={`px-4 py-3 ${subText}`}>{p.category}</td>
                          <td className={`px-4 py-3 ${p.stock < 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{p.stock}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-all duration-200"><Pencil size={13} /></button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-all duration-200"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Orders */}
            {tab === 'orders' && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className={`text-xl font-bold ${textColor}`}>{t('orders')}</h2>
                {state.orders.length === 0 ? (
                  <div className={`rounded-2xl border p-12 text-center ${cardBg}`}>
                    <ShoppingBag size={36} className="mx-auto mb-3 text-slate-600" />
                    <p className={subText}>{state.language === 'ru' ? 'Заказов пока нет' : state.language === 'be' ? 'Замоў пакуль няма' : 'No orders yet'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {state.orders.map(order => (
                      <div key={order.id} className={`rounded-2xl border p-4 ${cardBg}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-cyan-400 font-mono font-bold">{order.id}</span>
                            <span className={`ml-3 text-xs ${subText}`}>{new Date(order.date).toLocaleDateString()}</span>
                          </div>
                          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${subText}`}>{order.items.length} {state.language === 'en' ? 'items' : 'товаров'}</span>
                          <span className="text-emerald-400 font-bold">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics */}
            {tab === 'analytics' && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className={`text-xl font-bold ${textColor}`}>{t('analytics')}</h2>
                <div className={`rounded-2xl border p-5 ${cardBg}`}>
                  <h3 className={`font-semibold mb-1 ${textColor}`}>{t('salesChart')}</h3>
                  <p className={`text-xs mb-4 ${subText}`}>{state.language === 'ru' ? 'Выручка по месяцам (USD)' : state.language === 'be' ? 'Выручка па месяцах (USD)' : 'Revenue by month (USD)'}</p>
                  <BarChart data={salesData} labels={months} color="#06b6d4" />
                </div>
                <div className={`rounded-2xl border p-5 ${cardBg}`}>
                  <h3 className={`font-semibold mb-1 ${textColor}`}>{t('decisionTime')}</h3>
                  <p className={`text-xs mb-4 ${subText}`}>{state.language === 'ru' ? 'Среднее время (мин) до покупки после запроса ИИ-ассистента' : state.language === 'be' ? 'Сярэдні час (мін) да пакупкі пасля запыту ІІ-памочніка' : 'Average time (min) to purchase after AI assistant query'}</p>
                  <MiniLineChart data={decisionData} color="#10b981" height={60} />
                  <div className="flex justify-between mt-2">
                    {months.map((m, i) => <span key={i} className="text-[10px] text-slate-500">{m}</span>)}
                  </div>
                </div>
              </div>
            )}

            {/* Infrastructure */}
            {tab === 'infrastructure' && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className={`text-xl font-bold ${textColor}`}>{t('infrastructure')}</h2>
                <p className={`text-xs ${subText}`}>
                  {state.language === 'ru' ? 'Симуляция мониторинга реальной инфраструктуры (PostgreSQL + Redis + Celery)' :
                    state.language === 'be' ? 'Сімуляцыя маніторынгу рэальнай інфраструктуры (PostgreSQL + Redis + Celery)' :
                    'Real infrastructure monitoring simulation (PostgreSQL + Redis + Celery)'}
                </p>

                <div className={`rounded-2xl border p-5 ${cardBg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Database size={16} className="text-cyan-400" />
                    <h3 className={`font-semibold ${textColor}`}>{t('dbConnections')}</h3>
                  </div>
                  <p className={`text-xs mb-4 ${subText}`}>
                    {state.language === 'ru' ? 'Количество активных соединений с базой данных PostgreSQL. Высокое значение (>20) может указывать на проблему.' :
                      state.language === 'be' ? 'Колькасць актыўных злучэнняў з базай дадзеных PostgreSQL.' :
                      'Number of active PostgreSQL connections. High values (>20) may indicate an issue.'}
                  </p>
                  <InfraGauge value={dbConns} max={30} label={state.language === 'en' ? 'Connections' : 'Соединения'} sublabel="" color="#06b6d4" />
                  <div className="mt-3">
                    <MiniLineChart data={dbHistory} color="#06b6d4" />
                  </div>
                </div>

                <div className={`rounded-2xl border p-5 ${cardBg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <h3 className={`font-semibold ${textColor}`}>{t('cacheHitRate')}</h3>
                  </div>
                  <p className={`text-xs mb-4 ${subText}`}>
                    {state.language === 'ru' ? 'Процент запросов, обслуженных из кэша Redis. Целевое значение >85%.' :
                      state.language === 'be' ? 'Адсотак запытаў, абслужаных з кэша Redis. Мэтавае значэнне >85%.' :
                      'Percentage of requests served from Redis cache. Target >85%.'}
                  </p>
                  <InfraGauge value={cacheHit} max={100} label="Cache Hit Rate" sublabel="%" color="#10b981" />
                  <div className="mt-3">
                    <MiniLineChart data={cacheHistory} color="#10b981" />
                  </div>
                </div>

                <div className={`rounded-2xl border p-5 ${cardBg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu size={16} className="text-amber-400" />
                    <h3 className={`font-semibold ${textColor}`}>{t('taskQueue')}</h3>
                  </div>
                  <p className={`text-xs mb-4 ${subText}`}>
                    {state.language === 'ru' ? 'Размер очереди фоновых задач Celery: отслеживание цен, email-уведомления, обновление данных.' :
                      state.language === 'be' ? 'Памер чаргі фонавых задач Celery: адсочванне цэн, email-апавяшчэнні.' :
                      'Celery background task queue size: price tracking, email notifications, data updates.'}
                  </p>
                  <InfraGauge value={queueSize} max={20} label={state.language === 'en' ? 'Tasks' : 'Задач'} sublabel="" color="#f59e0b" />
                  <div className="mt-3">
                    <MiniLineChart data={queueHistory} color="#f59e0b" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
