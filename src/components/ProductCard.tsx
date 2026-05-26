import { useState } from 'react';
import { ShoppingCart, Star, Zap, Info, Tag, Heart } from 'lucide-react';
import { Product, calculateSmartScore, WarrantyLevel, getWarrantyPrice } from '../data/products';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
  onDetails: (product: Product) => void;
}

export default function ProductCard({ product, onDetails }: ProductCardProps) {
  const { state, dispatch, t, formatPrice } = useApp();
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);
  const [warrantyLevel, setWarrantyLevel] = useState<WarrantyLevel>('none');
  const inCart = state.cart.some(i => i.product.id === product.id);
  const isFavorite = state.favorites.includes(product.id);
  const isDark = state.theme === 'dark';
  const score = calculateSmartScore(product);

  const lang = state.language;
  const name = lang === 'ru' ? product.nameRu : lang === 'be' ? product.nameBe : product.nameEn;

  const cardBg = isDark
    ? 'bg-slate-800/60 border-slate-700/50 hover:border-cyan-500/40'
    : 'bg-white border-slate-200 hover:border-cyan-400/60';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const badgeBg = isDark ? 'bg-slate-700' : 'bg-slate-100';

  const warrantyOptions: { value: WarrantyLevel; key: string }[] = [
    { value: 'none', key: 'noWarranty' },
    { value: 'basic', key: 'warrantyBasic' },
    { value: 'proactive', key: 'warrantyProactive' },
    { value: 'max', key: 'warrantyMax' },
  ];

  const scoreTooltipText = {
    ru: `Формула: цена×30% + рейтинг×50% + отзывы×20%\nЦена (${product.price}$): ${Math.round((1 - Math.min(product.price / 2000, 1)) * 30)}п\nРейтинг (${product.rating}): ${Math.round(((product.rating - 1) / 4) * 50)}п\nОтзывы (${product.reviewCount}): ${Math.round(Math.min(product.reviewCount / 5000, 1) * 20)}п`,
    be: `Формула: цана×30% + рэйтынг×50% + водгукі×20%\nЦана (${product.price}$): ${Math.round((1 - Math.min(product.price / 2000, 1)) * 30)}п\nРэйтынг (${product.rating}): ${Math.round(((product.rating - 1) / 4) * 50)}п\nВодгукі (${product.reviewCount}): ${Math.round(Math.min(product.reviewCount / 5000, 1) * 20)}п`,
    en: `Formula: price×30% + rating×50% + reviews×20%\nPrice (${product.price}$): ${Math.round((1 - Math.min(product.price / 2000, 1)) * 30)}pts\nRating (${product.rating}): ${Math.round(((product.rating - 1) / 4) * 50)}pts\nReviews (${product.reviewCount}): ${Math.round(Math.min(product.reviewCount / 5000, 1) * 20)}pts`,
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_FAVORITE', payload: product.id });
  };

  return (
    <div className={`group relative rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${isDark ? 'hover:shadow-cyan-500/10' : 'hover:shadow-slate-300/60'} ${cardBg} overflow-hidden`}>
      {/* Discount badge */}
      {product.discount && product.discount > 0 && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
          <Tag size={10} />
          -{product.discount}%
        </div>
      )}

      {/* Favorite button */}
      {state.user && (
        <button
          onClick={handleToggleFavorite}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-200 ${
            isFavorite
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : isDark ? 'bg-slate-800/80 text-slate-400 hover:text-red-400 hover:bg-slate-700/80' : 'bg-white/80 text-slate-400 hover:text-red-400 hover:bg-white'
          }`}
        >
          <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
        </button>
      )}

      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={product.image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-t from-slate-800/60 to-transparent' : 'bg-gradient-to-t from-white/30 to-transparent'}`} />
      </div>

      <div className="p-4">
        {/* Brand + Category */}
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium uppercase tracking-wider text-cyan-500`}>{product.brand}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${badgeBg} ${subText}`}>{t(product.category as keyof typeof t extends never ? never : any)}</span>
        </div>

        {/* Name */}
        <h3 className={`font-semibold text-sm leading-tight mb-2 line-clamp-2 ${textColor}`}>{name}</h3>

        {/* Rating + Smart Score */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className={`text-xs font-medium ${textColor}`}>{product.rating.toFixed(1)}</span>
            <span className={`text-xs ${subText}`}>({product.reviewCount})</span>
          </div>
          <div
            className="relative flex items-center gap-1 cursor-help"
            onMouseEnter={() => setShowScoreTooltip(true)}
            onMouseLeave={() => setShowScoreTooltip(false)}
          >
            <Zap size={11} className="text-cyan-500" />
            <span className="text-xs font-bold text-cyan-500">{score}</span>
            <Info size={10} className={`${subText}`} />
            {showScoreTooltip && (
              <div className={`absolute bottom-full left-0 mb-2 w-64 p-3 rounded-xl text-xs leading-relaxed whitespace-pre-line shadow-2xl z-50 ${isDark ? 'bg-slate-900 border border-slate-700 text-slate-200' : 'bg-white border border-slate-200 text-slate-700'}`}>
                <div className="font-semibold text-cyan-500 mb-1">{t('smartScore')}: {score}/100</div>
                {scoreTooltipText[state.language]}
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-lg font-bold ${textColor}`}>{formatPrice(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className={`text-sm line-through ${subText}`}>{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        {/* Warranty selector (compact) - only for logged in */}
        {state.user && (
          <div className="mb-3">
            <select
              value={warrantyLevel}
              onChange={e => setWarrantyLevel(e.target.value as WarrantyLevel)}
              className={`w-full text-xs px-2 py-1.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
            >
              {warrantyOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.key as any)} {opt.value !== 'none' ? `(+${formatPrice(getWarrantyPrice(product, opt.value))})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {state.user ? (
            <button
              onClick={() => dispatch({ type: 'ADD_TO_CART', payload: { product, warrantyLevel } })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                inCart
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/25'
              }`}
            >
              <ShoppingCart size={14} />
              {inCart ? t('inCart') : t('addToCart')}
            </button>
          ) : (
            <button
              onClick={() => dispatch({ type: 'SET_AUTH_MODAL_OPEN', payload: true })}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all duration-200"
            >
              {t('login')}
            </button>
          )}
          <button
            onClick={() => onDetails(product)}
            className={`px-3 py-2 rounded-xl text-sm transition-all duration-200 border ${isDark ? 'border-slate-600 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400' : 'border-slate-200 text-slate-600 hover:border-cyan-400 hover:text-cyan-600'}`}
          >
            {t('details')}
          </button>
        </div>
      </div>
    </div>
  );
}
