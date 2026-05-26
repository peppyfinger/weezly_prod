import { useState } from 'react';
import { X, Star, ShoppingCart, Bell, BellOff, Zap, Shield, Check, Heart, ShoppingCart } from 'lucide-react';
import { Product, getWarrantyPrice, WarrantyLevel } from '../data/products';
import { useApp } from '../context/AppContext';
import Reviews from './Reviews';

interface ProductDetailProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetail({ product, onClose }: ProductDetailProps) {
  const { state, dispatch, t, formatPrice } = useApp();
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyLevel>('none');
  const [targetPrice, setTargetPrice] = useState('');

  const isDark = state.theme === 'dark';

  if (!product) return null;

  const inCart = state.cart.some(i => i.product.id === product.id);
  const isFavorite = state.favorites.includes(product.id);
  const isTracked = state.priceAlerts.some(a => a.productId === product.id);

  const lang = state.language;
  const name = lang === 'ru' ? product.nameRu : lang === 'be' ? product.nameBe : product.nameEn;
  const desc = lang === 'ru' ? product.descRu : lang === 'be' ? product.descBe : product.descEn;

  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const divider = isDark ? 'border-slate-700' : 'border-slate-200';
  const specBg = isDark ? 'bg-slate-800' : 'bg-slate-50';
  const inputBg = isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';

  const warrantyOptions: { value: WarrantyLevel; labelKey: string; months: number; features: string[] }[] = [
    {
      value: 'none',
      labelKey: 'noWarranty',
      months: 0,
      features: lang === 'ru' ? ['Только заводская гарантия'] : lang === 'be' ? ['Толькі заводская гарантыя'] : ['Factory warranty only'],
    },
    {
      value: 'basic',
      labelKey: 'warrantyBasic',
      months: 12,
      features: lang === 'ru' ? ['Замена при поломке', '12 месяцев'] : lang === 'be' ? ['Замена пры паломцы', '12 месяцаў'] : ['Replacement on failure', '12 months'],
    },
    {
      value: 'proactive',
      labelKey: 'warrantyProactive',
      months: 24,
      features: lang === 'ru' ? ['Превентивная диагностика', 'Замена запчастей', '24 месяца'] : lang === 'be' ? ['Прафілактычная дыягностыка', 'Замена запчастак', '24 месяцы'] : ['Preventive diagnostics', 'Parts replacement', '24 months'],
    },
    {
      value: 'max',
      labelKey: 'warrantyMax',
      months: 36,
      features: lang === 'ru' ? ['Полное покрытие', 'Приоритетный сервис', 'Обмен', '36 месяцев'] : lang === 'be' ? ['Поўнае пакрыццё', 'Прыярытэтны сэрвіс', '36 месяцаў'] : ['Full coverage', 'Priority service', 'Exchange', '36 months'],
    },
  ];

  const handleSetAlert = () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;
    const priceInUsd = state.currency === 'BYN' ? price / 3.25 : price;
    dispatch({ type: 'ADD_PRICE_ALERT', payload: { productId: product.id, targetPrice: priceInUsd, triggered: false } });
  };

  const totalPrice = product.price + getWarrantyPrice(product, selectedWarranty);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${isDark ? 'border-slate-700' : 'border-slate-200'} ${cardBg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${divider} sticky top-0 ${cardBg} z-10`}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-cyan-500 uppercase tracking-wider">{product.brand}</span>
            <span className={`text-xs ${subText}`}>·</span>
            <span className={`text-xs ${subText}`}>{t(product.category as any)}</span>
          </div>
          <div className="flex items-center gap-2">
            {state.user && (
              <button
                onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', payload: product.id })}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isFavorite
                    ? 'bg-red-500/20 text-red-400'
                    : isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-red-400' : 'hover:bg-slate-100 text-slate-500 hover:text-red-400'
                }`}
              >
                <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
              </button>
            )}
            <button onClick={onClose} className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Image */}
          <div>
            <div className="relative rounded-2xl overflow-hidden aspect-square">
              <img src={product.image} alt={name} className="w-full h-full object-cover" />
              {product.discount && product.discount > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                  -{product.discount}% {t('off')}
                </div>
              )}
            </div>

            {/* Specs */}
            <div className={`mt-4 rounded-xl p-4 ${specBg}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${subText}`}>
                {lang === 'ru' ? 'Характеристики' : lang === 'be' ? 'Характарыстыкі' : 'Specifications'}
              </p>
              <div className="space-y-1.5">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className={subText}>{key}</span>
                    <span className={`font-medium ${textColor}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            <div>
              <h2 className={`text-xl font-bold leading-tight ${textColor}`}>{name}</h2>
              <p className={`text-sm mt-2 leading-relaxed ${subText}`}>{desc}</p>
            </div>

            {/* Rating + Smart Score */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={14} className={i <= Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : isDark ? 'text-slate-600' : 'text-slate-300'} />
                ))}
                <span className={`text-sm font-medium ml-1 ${textColor}`}>{product.rating.toFixed(1)}</span>
                <span className={`text-xs ${subText}`}>({product.reviewCount})</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Zap size={12} className="text-cyan-500" />
                <span className="text-xs font-bold text-cyan-500">
                  {Math.round(
                    (1 - Math.min(product.price / 2000, 1)) * 30 +
                    ((product.rating - 1) / 4) * 50 +
                    Math.min(product.reviewCount / 5000, 1) * 20
                  )}/100
                </span>
              </div>
            </div>

            {/* Price with warranty */}
            <div className="flex items-end gap-3">
              <span className={`text-3xl font-bold ${textColor}`}>{formatPrice(totalPrice)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className={`text-lg line-through ${subText} mb-0.5`}>{formatPrice(product.originalPrice)}</span>
              )}
              {selectedWarranty !== 'none' && (
                <span className={`text-xs ${subText} mb-1`}>
                  ({t('warranty')}: +{formatPrice(getWarrantyPrice(product, selectedWarranty))})
                </span>
              )}
            </div>

            {/* Smart Warranty */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-cyan-500" />
                <span className={`text-sm font-semibold ${textColor}`}>{t('warrantyTitle')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {warrantyOptions.map(opt => {
                  const price = getWarrantyPrice(product, opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedWarranty(opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                        selectedWarranty === opt.value
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : isDark ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-1 ${selectedWarranty === opt.value ? 'text-cyan-500' : textColor}`}>
                        {t(opt.labelKey as any)}
                      </div>
                      {opt.value !== 'none' && (
                        <div className={`text-xs font-bold ${selectedWarranty === opt.value ? 'text-cyan-500' : 'text-emerald-500'}`}>
                          +{formatPrice(price)}
                        </div>
                      )}
                      <ul className="mt-1 space-y-0.5">
                        {opt.features.map((f, i) => (
                          <li key={i} className={`text-xs flex items-center gap-1 ${subText}`}>
                            <Check size={9} className="text-emerald-500 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Tracker - only for logged in users */}
            {state.user && (
              <div className={`rounded-xl border p-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Bell size={13} className="text-amber-400" />
                  <span className={`text-sm font-semibold ${textColor}`}>{t('priceTracker')}</span>
                  {isTracked && (
                    <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      {t('tracking')}
                    </span>
                  )}
                </div>
                {!isTracked ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={targetPrice}
                      onChange={e => setTargetPrice(e.target.value)}
                      placeholder={state.currency === 'USD' ? '$...' : 'BYN...'}
                      className={`flex-1 px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 ${inputBg}`}
                    />
                    <button
                      onClick={handleSetAlert}
                      className="px-3 py-2 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-400 transition-colors"
                    >
                      {t('setAlert')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${subText}`}>
                      {t('targetPrice')}: <span className="text-amber-400 font-medium">
                        {formatPrice(state.priceAlerts.find(a => a.productId === product.id)?.targetPrice ?? 0)}
                      </span>
                    </span>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_PRICE_ALERT', payload: product.id })}
                      className={`text-xs ${subText} hover:text-red-400`}
                    >
                      <BellOff size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Add to cart - only for logged in users */}
            {state.user && (
              <button
                onClick={() => {
                  dispatch({ type: 'ADD_TO_CART', payload: { product, warrantyLevel: selectedWarranty } });
                  onClose();
                }}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-200 ${
                  inCart
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/25'
                }`}
              >
                <ShoppingCart size={16} />
                {inCart ? t('inCart') : t('addToCart')}
              </button>
            )}

            {/* Login prompt */}
            {!state.user && (
              <button
                onClick={() => dispatch({ type: 'SET_AUTH_MODAL_OPEN', payload: true })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all duration-200"
              >
                {t('loginRequired')} →
              </button>
            )}
          </div>
        </div>

        {/* Reviews section */}
        <div className={`px-5 pb-5 border-t ${divider} mt-4 pt-5`}>
          <Reviews productId={product.id} currentRating={product.rating} reviewCount={product.reviewCount} />
        </div>
      </div>
    </div>
  );
}
