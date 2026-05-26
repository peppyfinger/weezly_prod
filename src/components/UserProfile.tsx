import { useState } from 'react';
import { X, User, Mail, Phone, MapPin, Save, Package, Heart, ChevronRight, Calendar, CreditCard, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getWarrantyPrice } from '../data/products';

interface UserProfileProps {
  open: boolean;
  onClose: () => void;
}

export default function UserProfile({ open, onClose }: UserProfileProps) {
  const { state, dispatch, t, formatPrice } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'favorites'>('profile');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: state.user?.name || '',
    email: state.user?.email || '',
    phone: state.user?.phone || '',
    address: state.user?.address || '',
    city: state.user?.city || '',
    zipCode: state.user?.zipCode || '',
    country: state.user?.country || 'Belarus',
  });
  const [saved, setSaved] = useState(false);

  const isDark = state.theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const divider = isDark ? 'border-slate-700' : 'border-slate-200';
  const inputBg = isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';
  const hoverBg = isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100';

  if (!open || !state.user) return null;

  const handleSave = () => {
    dispatch({ type: 'UPDATE_USER', payload: formData });
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const favoriteProducts = state.products.filter(p => state.favorites.includes(p.id));

  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${inputBg}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'delivered': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'shipped': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(state.language === 'ru' ? 'ru-RU' : state.language === 'be' ? 'be-BY' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-slate-700' : 'border-slate-200'} ${cardBg} flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${divider}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
              {state.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className={`text-lg font-bold ${textColor}`}>{state.user.name}</h2>
              <p className={`text-xs ${subText}`}>{state.user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-all duration-200 ${hoverBg}`}>
            <X size={18} className={subText} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${divider}`}>
          {[
            { key: 'profile', icon: User, label: t('profile') },
            { key: 'orders', icon: Package, label: state.language === 'ru' ? 'Заказы' : state.language === 'be' ? 'Замовы' : 'Orders' },
            { key: 'favorites', icon: Heart, label: state.language === 'ru' ? 'Избранное' : state.language === 'be' ? 'Абранае' : 'Favorites' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'profile' | 'orders' | 'favorites')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'text-cyan-500 border-b-2 border-cyan-500'
                  : `${subText} ${hoverBg}`
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-fade-in-up">
              {editMode ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('firstName')}</label>
                      <input className={inputClass} value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('email')}</label>
                      <input type="email" className={inputClass} value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${subText}`}>
                      {state.language === 'ru' ? 'Телефон' : state.language === 'be' ? 'Тэлефон' : 'Phone'}
                    </label>
                    <div className="relative">
                      <Phone size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText}`} />
                      <input className={`${inputClass} pl-9`} value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} placeholder="+375..." />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('address')}</label>
                    <div className="relative">
                      <MapPin size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subText}`} />
                      <input className={`${inputClass} pl-9`} value={formData.address} onChange={e => setFormData(f => ({ ...f, address: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('city')}</label>
                      <input className={inputClass} value={formData.city} onChange={e => setFormData(f => ({ ...f, city: e.target.value }))} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('zipCode')}</label>
                      <input className={inputClass} value={formData.zipCode} onChange={e => setFormData(f => ({ ...f, zipCode: e.target.value }))} />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('country')}</label>
                      <input className={inputClass} value={formData.country} onChange={e => setFormData(f => ({ ...f, country: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all">
                      <Save size={16} />
                      {t('save')}
                    </button>
                    <button onClick={() => setEditMode(false)} className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'} ${hoverBg}`}>
                      {t('cancel')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}}`}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User size={16} className={subText} />
                        <div>
                          <p className={`text-xs ${subText}`}>{t('firstName')}</p>
                          <p className={`font-medium ${textColor}`}>{state.user.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={16} className={subText} />
                        <div>
                          <p className={`text-xs ${subText}`}>{t('email')}</p>
                          <p className={`font-medium ${textColor}`}>{state.user.email}</p>
                        </div>
                      </div>
                      {state.user.phone && (
                        <div className="flex items-center gap-3">
                          <Phone size={16} className={subText} />
                          <div>
                            <p className={`text-xs ${subText}`}>{state.language === 'ru' ? 'Телефон' : state.language === 'be' ? 'Тэлефон' : 'Phone'}</p>
                            <p className={`font-medium ${textColor}`}>{state.user.phone}</p>
                          </div>
                        </div>
                      )}
                      {state.user.address && (
                        <div className="flex items-center gap-3">
                          <MapPin size={16} className={subText} />
                          <div>
                            <p className={`text-xs ${subText}`}>{t('address')}</p>
                            <p className={`font-medium ${textColor}`}>
                              {state.user.address}{state.user.city ? `, ${state.user.city}` : ''}{state.user.zipCode ? `, ${state.user.zipCode}` : ''}{state.user.country ? `, ${state.user.country}` : ''}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setEditMode(true)} className="w-full py-2.5 rounded-xl text-sm font-medium border border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10 transition-all">
                    {state.language === 'ru' ? 'Редактировать профиль' : state.language === 'be' ? 'Рэдагаваць профіль' : 'Edit Profile'}
                  </button>
                  {saved && (
                    <div className={`p-3 rounded-xl text-sm text-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30`}>
                      {state.language === 'ru' ? 'Профиль сохранён!' : state.language === 'be' ? 'Профіль захаваны!' : 'Profile saved!'}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-3 animate-fade-in-up">
              {state.orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Package size={40} className={subText} />
                  <p className={`text-sm ${subText}`}>
                    {state.language === 'ru' ? 'Заказов пока нет' : state.language === 'be' ? 'Замоў пакуль няма' : 'No orders yet'}
                  </p>
                </div>
              ) : (
                state.orders.map(order => (
                  <div key={order.id} className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className={`font-mono font-bold ${textColor}`}>{order.id}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar size={12} className={subText} />
                          <span className={`text-xs ${subText}`}>{formatDate(order.date)}</span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status === 'paid' ? (state.language === 'ru' ? 'Оплачен' : state.language === 'be' ? 'Аплачаны' : 'Paid') :
                         order.status === 'delivered' ? (state.language === 'ru' ? 'Доставлен' : state.language === 'be' ? 'Дастаўлены' : 'Delivered') :
                         order.status === 'shipped' ? (state.language === 'ru' ? 'В пути' : state.language === 'be' ? 'У дарозе' : 'Shipped') :
                         (state.language === 'ru' ? 'В обработке' : state.language === 'be' ? 'У апрацоўцы' : 'Processing')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {order.items.map(item => {
                        const name = state.language === 'ru' ? item.product.nameRu : state.language === 'be' ? item.product.nameBe : item.product.nameEn;
                        const warrantyPrice = getWarrantyPrice(item.product, item.warrantyLevel);
                        return (
                          <div key={item.product.id} className="flex items-center gap-3">
                            <img src={item.product.image} alt={name} className="w-10 h-10 object-cover rounded-lg" />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${textColor}`}>{name}</p>
                              <p className={`text-xs ${subText}`}>
                                x{item.quantity} {item.warrantyLevel !== 'none' ? `(+${formatPrice(warrantyPrice)})` : ''}
                              </p>
                            </div>
                            <span className={`text-sm font-bold ${textColor}`}>{formatPrice((item.product.price + warrantyPrice) * item.quantity)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className={`flex items-center justify-between mt-3 pt-3 border-t ${divider}`}>
                      <span className={`text-sm ${subText}`}>
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} {state.language === 'ru' ? 'товаров' : state.language === 'be' ? 'тавараў' : 'items'}
                      </span>
                      <span className={`text-lg font-bold text-cyan-500`}>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="space-y-3 animate-fade-in-up">
              {favoriteProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Heart size={40} className={subText} />
                  <p className={`text-sm ${subText}`}>
                    {state.language === 'ru' ? 'Список избранного пуст' : state.language === 'be' ? 'Спіс абранага пусты' : 'Favorites list is empty'}
                  </p>
                </div>
              ) : (
                favoriteProducts.map(product => {
                  const name = state.language === 'ru' ? product.nameRu : state.language === 'be' ? product.nameBe : product.nameEn;
                  const inCart = state.cart.some(i => i.product.id === product.id);
                  return (
                    <div key={product.id} className={`flex items-center gap-4 p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <img src={product.image} alt={name} className="w-16 h-16 object-cover rounded-xl" />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${textColor}`}>{name}</p>
                        <p className={`text-sm font-bold text-cyan-500`}>{formatPrice(product.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            dispatch({ type: 'ADD_TO_CART', payload: { product } });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            inCart
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                          }`}
                        >
                          {inCart ? (state.language === 'ru' ? 'В корзине' : state.language === 'be' ? 'У кошыку' : 'In Cart') : (t('addToCart'))}
                        </button>
                        <button
                          onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', payload: product.id })}
                          className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-red-400' : 'hover:bg-slate-200 text-red-500'}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
