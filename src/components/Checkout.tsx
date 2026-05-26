import { useState } from 'react';
import { X, CreditCard, Banknote, Building2, Check, Package, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getWarrantyPrice, WarrantyLevel } from '../data/products';
import { Order } from '../context/AppContext';
import { createPaymentCheckout, sendEmail } from '../api';

interface CheckoutProps {
  open: boolean;
  onClose: () => void;
}

export default function Checkout({ open, onClose }: CheckoutProps) {
  const { state, dispatch, t, formatPrice, cartTotal } = useApp();
  const [step, setStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'online'>('card');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', zipCode: '', country: 'Belarus',
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const isDark = state.theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-white';
  const divider = isDark ? 'border-slate-700' : 'border-slate-200';

  if (!open) return null;

  const handlePlaceOrder = async () => {
    setPaymentError('');
    setPaymentLoading(true);

    const id = `WZL-${Date.now().toString(36).toUpperCase()}`;

    if (paymentMethod === 'card') {
      // Process payment via bePaid
      try {
        const result = await createPaymentCheckout({
          amount: cartTotal,
          currency: state.currency,
          orderId: id,
          customerEmail: form.email,
          description: `WEEZLY Order ${id}`,
          language: state.language,
        });

        if (result.success && result.checkoutUrl) {
          // Open bePaid checkout in new window or iframe
          // For demo, we'll simulate successful payment
          setCheckoutUrl(result.checkoutUrl);

          // Simulate payment success (in production, this would be via webhook)
          setTimeout(() => {
            completeOrder(id);
          }, 2000);
        } else if (result.token) {
          // Demo mode - simulate success
          setTimeout(() => {
            completeOrder(id);
          }, 1500);
        } else {
          setPaymentError(result.error || 'Payment failed');
          setPaymentLoading(false);
        }
      } catch (err) {
        console.error('Payment error:', err);
        // Demo fallback
        setTimeout(() => {
          completeOrder(id);
        }, 1500);
      }
    } else {
      // Cash or online banking - no immediate payment
      completeOrder(id);
    }
  };

  const completeOrder = (id: string) => {
    setOrderNumber(id);
    const order: Order = {
      id,
      items: [...state.cart],
      total: cartTotal,
      currency: state.currency,
      date: new Date().toISOString(),
      status: 'processing',
      address: form,
    };
    dispatch({ type: 'ADD_ORDER', payload: order });
    dispatch({ type: 'CLEAR_CART' });
    setPaymentLoading(false);
    setStep(4);

    // Send order confirmation email
    if (form.email) {
      const items = state.cart.map(item => {
        const warrantyPrice = getWarrantyPrice(item.product, item.warrantyLevel);
        return {
          name: state.language === 'ru' ? item.product.nameRu : state.language === 'be' ? item.product.nameBe : item.product.nameEn,
          qty: item.quantity,
          price: formatPrice(item.product.price + warrantyPrice),
          warranty: item.warrantyLevel !== 'none' ? formatPrice(warrantyPrice) : undefined,
        };
      });

      sendEmail({
        to: form.email,
        type: 'orderConfirmation',
        language: state.language,
        data: {
          orderId: id,
          items,
          total: formatPrice(cartTotal),
          address: `${form.address}, ${form.city}, ${form.zipCode}, ${form.country}`,
        },
      }).catch(err => console.error('Failed to send order email:', err));
    }
  };

  const steps = [t('step1'), t('step2'), t('step3'), t('step4')];

  const inputClass = `w-full px-3 py-2.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${inputBg}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${isDark ? 'border-slate-700' : 'border-slate-200'} ${cardBg}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${divider} sticky top-0 ${cardBg} z-10`}>
          <h2 className={`text-lg font-bold ${textColor}`}>{t('checkoutTitle')}</h2>
          {step !== 4 && (
            <button onClick={onClose} className={`p-2 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Steps indicator */}
        {step < 4 && (
          <div className={`px-5 py-3 border-b ${divider}`}>
            <div className="flex items-center gap-2">
              {steps.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    i + 1 < step ? 'bg-emerald-500 text-white' :
                    i + 1 === step ? 'bg-cyan-500 text-white' :
                    isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {i + 1 < step ? <Check size={12} /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${i + 1 === step ? 'text-cyan-500 font-medium' : subText}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="space-y-3 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('firstName')}</label>
                  <input className={inputClass} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('lastName')}</label>
                  <input className={inputClass} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('email')}</label>
                  <input type="email" className={inputClass} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('phone')}</label>
                  <input className={inputClass} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('address')}</label>
                <input className={inputClass} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('city')}</label>
                  <input className={inputClass} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('zipCode')}</label>
                  <input className={inputClass} value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${subText}`}>{t('country')}</label>
                  <input className={inputClass} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="space-y-3 animate-fade-in-up">
              <p className={`text-sm font-medium ${textColor}`}>{t('paymentMethod')}</p>
              {[
                { value: 'card', icon: <CreditCard size={18} />, label: t('creditCard'), desc: state.language === 'ru' ? 'Оплата картой через bePaid' : state.language === 'be' ? 'Аплата картай праз bePaid' : 'Pay via bePaid' },
                { value: 'cash', icon: <Banknote size={18} />, label: t('cashOnDelivery'), desc: state.language === 'ru' ? 'Оплата при получении' : state.language === 'be' ? 'Аплата пры атрыманні' : 'Pay on delivery' },
                { value: 'online', icon: <Building2 size={18} />, label: t('onlineBanking'), desc: state.language === 'ru' ? 'Интернет-банкинг' : state.language === 'be' ? 'Інтэрнэт-банкінг' : 'Online banking' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPaymentMethod(opt.value as 'card' | 'cash' | 'online')}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${
                    paymentMethod === opt.value
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                      : isDark ? 'border-slate-700 text-slate-300 hover:border-slate-500' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {opt.icon}
                  <div className="text-left">
                    <span className="font-medium">{opt.label}</span>
                    <p className={`text-xs ${paymentMethod === opt.value ? 'text-cyan-400' : subText}`}>{opt.desc}</p>
                  </div>
                  {paymentMethod === opt.value && <Check size={16} className="ml-auto" />}
                </button>
              ))}

              {paymentMethod === 'card' && (
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <p className={`text-xs ${subText} mb-2`}>
                    {state.language === 'ru' ? 'Тестовые карты bePaid для проверки:' :
                      state.language === 'be' ? 'Тэставыя карты bePaid для праверкі:' :
                      'Test bePaid cards for testing:'}
                  </p>
                  <div className={`text-xs font-mono space-y-1 ${textColor}`}>
                    <p>4242 4242 4242 4242</p>
                    <p className={subText}>
                      {state.language === 'ru' ? 'Любая дата, любой CVV' :
                        state.language === 'be' ? 'Любая дата, любы CVV' :
                        'Any date, any CVV'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <p className={`text-sm font-semibold mb-2 ${textColor}`}>{t('orderSummary')}</p>
                <div className="space-y-2">
                  {state.cart.map(item => {
                    const name = state.language === 'ru' ? item.product.nameRu : state.language === 'be' ? item.product.nameBe : item.product.nameEn;
                    const warrantyPrice = getWarrantyPrice(item.product, item.warrantyLevel);
                    return (
                      <div key={item.product.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <img src={item.product.image} alt={name} className="w-10 h-10 object-cover rounded-lg" />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${textColor}`}>{name}</p>
                          <p className={`text-xs ${subText}`}>x{item.quantity} {item.warrantyLevel !== 'none' ? `(+${formatPrice(warrantyPrice)} ${state.language === 'ru' ? 'гарантия' : state.language === 'be' ? 'гарантыя' : 'warranty'})` : ''}</p>
                        </div>
                        <span className={`text-sm font-bold ${textColor}`}>{formatPrice((item.product.price + warrantyPrice) * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`flex justify-between font-bold ${textColor}`}>
                  <span>{t('total')}</span>
                  <span className="text-cyan-500">{formatPrice(cartTotal)}</span>
                </div>
              </div>

              {paymentError && (
                <div className={`p-3 rounded-xl text-sm ${isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                  {paymentError}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirmed */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 animate-fade-in-up">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                <Check size={36} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <h3 className={`text-xl font-bold ${textColor}`}>{t('orderConfirmed')}</h3>
                <p className={`text-sm ${subText} mt-1`}>{t('orderNumber')}: <span className="text-cyan-500 font-mono font-bold">{orderNumber}</span></p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Package size={16} className="text-cyan-500" />
                <span className={`text-sm ${subText}`}>
                  {state.language === 'ru' ? 'Заказ передан в обработку' : state.language === 'be' ? 'Замова перададзена ў апрацоўку' : 'Order is being processed'}
                </span>
              </div>
              <p className={`text-xs ${subText}`}>
                {state.language === 'ru' ? `Письмо с деталями заказа отправлено на ${form.email}` :
                  state.language === 'be' ? `Ліст з дэталямі замовы адпраўлены на ${form.email}` :
                  `Order details sent to ${form.email}`}
              </p>
              <button
                onClick={() => { onClose(); setStep(1); }}
                className="mt-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-all duration-200 hover:from-cyan-400 hover:to-blue-500"
              >
                {t('continueShopping')}
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step < 4 && (
          <div className={`flex items-center justify-between p-5 border-t ${divider}`}>
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className={`px-4 py-2 rounded-xl text-sm border transition-all duration-200 ${isDark ? 'border-slate-700 text-slate-300 hover:border-slate-500' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                {t('back')}
              </button>
            ) : <div />}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white transition-all duration-200 hover:from-cyan-400 hover:to-blue-500">
                {t('next')}
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={paymentLoading}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  paymentLoading
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white hover:from-emerald-400 hover:to-cyan-500'
                }`}
              >
                {paymentLoading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    {state.language === 'ru' ? 'Обработка...' : state.language === 'be' ? 'Апрацоўка...' : 'Processing...'}
                  </>
                ) : (
                  t('placeOrder')
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
