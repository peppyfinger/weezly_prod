import { useState, useMemo } from 'react';
import { Bot, Settings } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Product, calculateSmartScore } from './data/products';
import { Category } from './data/products';
import Header from './components/Header';
import Filters, { SortOption } from './components/Filters';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import AIAssistant from './components/AIAssistant';
import AdminPanel from './components/AdminPanel';
import AdminLoginModal from './components/AdminLoginModal';
import AuthModal from './components/AuthModal';
import Notifications from './components/Notifications';
import Mailbox from './components/Mailbox';

function MainApp() {
  const { state, dispatch, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [aiFilterIds, setAiFilterIds] = useState<number[] | null>(null);

  const isDark = state.theme === 'dark';

  // Apply AI filter
  const baseProducts = aiFilterIds
    ? state.products.filter(p => aiFilterIds.includes(p.id))
    : state.products;

  const availableBrands = useMemo(() => [...new Set(state.products.map(p => p.brand))].sort(), [state.products]);

  const filteredProducts = useMemo(() => {
    let products = [...baseProducts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      products = products.filter(p =>
        p.nameRu.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.nameBe.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      products = products.filter(p => p.category === selectedCategory);
    }

    products = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedBrands.length > 0) {
      products = products.filter(p => selectedBrands.includes(p.brand));
    }

    switch (sortBy) {
      case 'price_asc': products.sort((a, b) => a.price - b.price); break;
      case 'price_desc': products.sort((a, b) => b.price - a.price); break;
      case 'rating': products.sort((a, b) => b.rating - a.rating); break;
      case 'smart_score':
      case 'default': products.sort((a, b) => calculateSmartScore(b) - calculateSmartScore(a)); break;
    }

    return products;
  }, [baseProducts, searchQuery, selectedCategory, sortBy, priceRange, selectedBrands]);

  const bgColor = isDark
    ? 'bg-slate-950 text-white'
    : 'bg-slate-50 text-slate-900';

  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';

  const handleProductClick = (productId: number) => {
    const p = state.products.find(p => p.id === productId);
    if (p) setSelectedProduct(p);
  };

  const handleAdminClick = () => {
    if (state.isAdmin) {
      dispatch({ type: 'SET_ADMIN_MODAL_OPEN', payload: true });
    } else {
      dispatch({ type: 'SET_ADMIN_MODAL_OPEN', payload: true });
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgColor}`}>
      <Header
        onAdminClick={handleAdminClick}
        onMailboxClick={() => dispatch({ type: 'SET_MAILBOX_OPEN', payload: true })}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAuthClick={() => dispatch({ type: 'SET_AUTH_MODAL_OPEN', payload: true })}
      />

      {/* Main content */}
      <main className="max-w-screen-2xl mx-auto px-4 pt-20 pb-24">
        {/* Hero section - only visible for guests */}
        {!state.user && (
          <section className="py-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              {state.language === 'ru' ? 'Платформа электронной коммерции нового поколения' :
                state.language === 'be' ? 'Платформа электроннай камерцыі новага пакалення' :
                'Next-generation e-commerce platform'}
            </div>
            <h1 className={`text-5xl font-extrabold mb-4 ${textColor}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {state.language === 'ru' ? 'Умные покупки,' :
                state.language === 'be' ? 'Разумныя пакупкі,' :
                'Smart shopping,'}
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {state.language === 'ru' ? 'лучший выбор' :
                  state.language === 'be' ? 'лепшы выбар' :
                  'best choice'}
              </span>
            </h1>
            <p className={`text-lg max-w-xl mx-auto ${subText}`}>
              {state.language === 'ru' ? 'ИИ-ассистент поможет найти идеальный товар в вашем бюджете' :
                state.language === 'be' ? 'ІІ-памочнік дапаможа знайсці ідэальны тавар у вашым бюджэце' :
                'AI assistant helps you find the perfect product within your budget'}
            </p>
          </section>
        )}

        {/* Filters */}
        <Filters
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          sortBy={sortBy}
          setSortBy={setSortBy}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          selectedBrands={selectedBrands}
          setSelectedBrands={setSelectedBrands}
          availableBrands={availableBrands}
          resultCount={filteredProducts.length}
        />

        {/* AI filter active notice */}
        {aiFilterIds !== null && (
          <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border ${isDark ? 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-600'}`}>
            <Bot size={15} />
            <span className="text-sm">
              {state.language === 'ru' ? 'Показаны результаты по запросу ИИ-ассистента' :
                state.language === 'be' ? 'Паказаны вынікі па запыце ІІ-памочніка' :
                'Showing AI assistant results'}
            </span>
            <button
              onClick={() => setAiFilterIds(null)}
              className={`ml-auto text-xs underline ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t('resetFilters')}
            </button>
          </div>
        )}

        {/* Products grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onDetails={setSelectedProduct}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <div className={`w-16 h-16 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center`}>
                <span className="text-3xl">🔍</span>
              </div>
              <p className={`text-lg font-medium ${textColor}`}>{t('noResults')}</p>
              <p className={`text-sm ${subText}`}>
                {state.language === 'ru' ? 'Попробуйте изменить параметры поиска' :
                  state.language === 'be' ? 'Паспрабуйце змяніць параметры пошуку' :
                  'Try adjusting your search filters'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-100/50'} py-8`}>
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">W</span>
              </div>
              <span className={`font-bold ${textColor}`}>WEEZLY</span>
              <span className={`text-xs ${subText}`}>© 2024</span>
            </div>
            <div className="flex items-center gap-4">
              {state.isAdmin && (
                <button
                  onClick={handleAdminClick}
                  className={`text-xs ${subText} hover:text-amber-500 transition-colors`}
                >
                  {t('adminPanel')}
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* AI Assistant floating button */}
      <button
        onClick={() => dispatch({ type: 'SET_ASSISTANT_OPEN', payload: true })}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 hover:scale-105 animate-float"
      >
        <Bot size={18} />
        <span className="text-sm font-medium hidden sm:block">{t('aiAssistant')}</span>
      </button>

      {/* Admin floating button - only for admin */}
      {state.isAdmin && (
        <button
          onClick={handleAdminClick}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-2xl shadow-amber-500/30 hover:from-amber-400 hover:to-orange-500 transition-all duration-300 hover:scale-105"
        >
          <Settings size={18} />
          <span className="text-sm font-medium hidden sm:block">{t('adminPanel')}</span>
        </button>
      )}

      {/* Overlays and modals */}
      <Cart onCheckout={() => setCheckoutOpen(true)} />
      <Checkout open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <AIAssistant onFilterProducts={setAiFilterIds} />
      <AdminPanel open={state.adminModalOpen} onClose={() => dispatch({ type: 'SET_ADMIN_MODAL_OPEN', payload: false })} />
      <AdminLoginModal open={state.adminModalOpen && !state.isAdmin} onClose={() => dispatch({ type: 'SET_ADMIN_MODAL_OPEN', payload: false })} />
      <AuthModal open={state.authModalOpen} onClose={() => dispatch({ type: 'SET_AUTH_MODAL_OPEN', payload: false })} />
      <Notifications />

      {/* Mailbox */}
      {state.user && (
        <Mailbox
          open={state.mailboxOpen}
          onClose={() => dispatch({ type: 'SET_MAILBOX_OPEN', payload: false })}
          onProductClick={handleProductClick}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
