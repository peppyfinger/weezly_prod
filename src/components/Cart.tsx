import { X, Minus, Plus, ShoppingCart, ArrowRight, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WarrantyLevel, getWarrantyPrice } from '../data/products';

interface CartProps {
  onCheckout: () => void;
}

export default function Cart({ onCheckout }: CartProps) {
  const { state, dispatch, t, formatPrice, cartTotal } = useApp();
  const isDark = state.theme === 'dark';

  if (!state.cartOpen || !state.user) return null;

  const overlayBg = 'bg-black/60 backdrop-blur-sm';
  const panelBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const divider = isDark ? 'border-slate-700' : 'border-slate-100';
  const itemBg = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100';

  const warrantyOptions: { value: WarrantyLevel; key: string }[] = [
    { value: 'none', key: 'noWarranty' },
    { value: 'basic', key: 'warrantyBasic' },
    { value: 'proactive', key: 'warrantyProactive' },
    { value: 'max', key: 'warrantyMax' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className={`flex-1 ${overlayBg}`} onClick={() => dispatch({ type: 'SET_CART_OPEN', payload: false })} />
      <div className={`w-full max-w-md border-l animate-slide-in-right flex flex-col ${panelBg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${divider}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <div>
              <h2 className={`font-bold ${textColor}`}>{t('yourCart')}</h2>
              <p className={`text-xs ${subText}`}>{state.cart.length} {state.language === 'en' ? 'items' : state.language === 'be' ? 'тавараў' : 'товаров'}</p>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_CART_OPEN', payload: false })}
            className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {state.cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
              <div className={`w-16 h-16 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center`}>
                <ShoppingCart size={28} className={subText} />
              </div>
              <div className="text-center">
                <p className={`font-medium ${textColor}`}>{t('emptyCart')}</p>
                <p className={`text-sm ${subText}`}>{t('emptyCartDesc')}</p>
              </div>
            </div>
          ) : (
            state.cart.map(item => {
              const name = state.language === 'ru' ? item.product.nameRu : state.language === 'be' ? item.product.nameBe : item.product.nameEn;
              const warrantyPrice = getWarrantyPrice(item.product, item.warrantyLevel);
              const lineTotal = (item.product.price + warrantyPrice) * item.quantity;

              return (
                <div key={item.product.id} className={`rounded-xl border p-3 ${itemBg}`}>
                  <div className="flex gap-3">
                    <img
                      src={item.product.image}
                      alt={name}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-tight line-clamp-2 ${textColor}`}>{name}</p>
                        <button
                          onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.product.id })}
                          className="flex-shrink-0 text-red-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className={`text-xs ${subText} mt-0.5`}>{item.product.brand}</p>

                      {/* Warranty */}
                      <div className="mt-1.5">
                        <select
                          value={item.warrantyLevel}
                          onChange={e => dispatch({ type: 'UPDATE_CART_WARRANTY', payload: { productId: item.product.id, warrantyLevel: e.target.value as WarrantyLevel } })}
                          className={`text-xs px-2 py-1 rounded-lg border transition-all duration-200 focus:outline-none w-full ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}
                        >
                          {warrantyOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {t(opt.key as any)} {opt.value !== 'none' ? `(+${formatPrice(getWarrantyPrice(item.product, opt.value))})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Qty + Price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId: item.product.id, quantity: item.quantity - 1 } })}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                          >
                            <Minus size={10} />
                          </button>
                          <span className={`text-sm font-medium w-6 text-center ${textColor}`}>{item.quantity}</span>
                          <button
                            onClick={() => dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId: item.product.id, quantity: item.quantity + 1 } })}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <span className={`text-sm font-bold ${textColor}`}>{formatPrice(lineTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {state.cart.length > 0 && (
          <div className={`p-5 border-t ${divider} space-y-3`}>
            <div className={`flex justify-between text-sm ${subText}`}>
              <span>{t('subtotal')}</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className={`flex justify-between font-bold text-base ${textColor}`}>
              <span>{t('total')}</span>
              <span className="text-cyan-500">{formatPrice(cartTotal)}</span>
            </div>
            <button
              onClick={() => {
                dispatch({ type: 'SET_CART_OPEN', payload: false });
                onCheckout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-all duration-200 hover:from-cyan-400 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/25"
            >
              {t('checkout')}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
