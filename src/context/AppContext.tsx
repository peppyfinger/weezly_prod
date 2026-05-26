import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { Language, Currency, USD_TO_BYN, translations } from '../data/translations';
import { Product, WarrantyLevel, initialProducts, getWarrantyPrice } from '../data/products';
import { sendEmail } from '../api';

export type Theme = 'dark' | 'light';

export interface Review {
  id: string;
  productId: number;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  warrantyLevel: WarrantyLevel;
}

export interface PriceAlert {
  productId: number;
  targetPrice: number;
  triggered: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  currency: Currency;
  date: string;
  status: 'processing' | 'shipped' | 'delivered' | 'paid';
  address: Record<string, string>;
}

export interface MailMessage {
  id: string;
  subject: string;
  from: string;
  body: string;
  date: string;
  productId?: number;
  read: boolean;
}

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  productId?: number;
}

export interface User {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
}

export interface AppState {
  theme: Theme;
  language: Language;
  currency: Currency;
  products: Product[];
  reviews: Review[];
  cart: CartItem[];
  favorites: number[];
  priceAlerts: PriceAlert[];
  orders: Order[];
  mailbox: MailMessage[];
  toasts: Toast[];
  cartOpen: boolean;
  assistantOpen: boolean;
  checkoutOpen: boolean;
  authModalOpen: boolean;
  adminModalOpen: boolean;
  mailboxOpen: boolean;
  profileOpen: boolean;
  favoritesOpen: boolean;
  user: User | null;
  isAdmin: boolean;
  unreadMail: number;
}

type Action =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'LOGIN_USER'; payload: User }
  | { type: 'LOGIN_ADMIN' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'ADD_TO_CART'; payload: { product: Product; warrantyLevel?: WarrantyLevel } }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'UPDATE_CART_WARRANTY'; payload: { productId: number; warrantyLevel: WarrantyLevel } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART_OPEN'; payload: boolean }
  | { type: 'SET_ASSISTANT_OPEN'; payload: boolean }
  | { type: 'SET_CHECKOUT_OPEN'; payload: boolean }
  | { type: 'SET_AUTH_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_ADMIN_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_MAILBOX_OPEN'; payload: boolean }
  | { type: 'SET_PROFILE_OPEN'; payload: boolean }
  | { type: 'SET_FAVORITES_OPEN'; payload: boolean }
  | { type: 'ADD_PRICE_ALERT'; payload: PriceAlert }
  | { type: 'REMOVE_PRICE_ALERT'; payload: number }
  | { type: 'UPDATE_PRODUCT_PRICE'; payload: { productId: number; newPrice: number; discount: number } }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: number }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'ADD_REVIEW'; payload: Review }
  | { type: 'ADD_MAIL'; payload: MailMessage }
  | { type: 'MARK_MAIL_READ'; payload: string }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'TRIGGER_ALERT'; payload: number }
  | { type: 'TOGGLE_FAVORITE'; payload: number }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

// localStorage keys
const STORAGE_KEY = 'weezly_state';
const PRODUCTS_KEY = 'weezly_products';

// Get initial products with reset reviews
const getInitialProducts = (): Product[] => {
  const stored = localStorage.getItem(PRODUCTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through to reset
    }
  }
  // Return products with empty reviews (rating 0, count 0)
  return initialProducts.map(p => ({ ...p, rating: 0, reviewCount: 0 }));
};

const loadFromStorage = (): Partial<AppState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        theme: parsed.theme || 'dark',
        language: parsed.language || 'ru',
        currency: parsed.currency || 'BYN',
        user: parsed.user || null,
        isAdmin: parsed.isAdmin || false,
        cart: parsed.cart || [],
        favorites: parsed.favorites || [],
        priceAlerts: parsed.priceAlerts || [],
        orders: parsed.orders || [],
        reviews: parsed.reviews || [],
        mailbox: parsed.mailbox || [],
        unreadMail: parsed.unreadMail || 0,
      };
    }
  } catch (e) {
    console.error('Failed to load state from storage:', e);
  }
  return {};
};

const saveToStorage = (state: AppState) => {
  try {
    const toSave = {
      theme: state.theme,
      language: state.language,
      currency: state.currency,
      user: state.user,
      isAdmin: state.isAdmin,
      cart: state.cart,
      favorites: state.favorites,
      priceAlerts: state.priceAlerts,
      orders: state.orders,
      reviews: state.reviews,
      mailbox: state.mailbox,
      unreadMail: state.unreadMail,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(state.products));
  } catch (e) {
    console.error('Failed to save state to storage:', e);
  }
};

const initialState: AppState = {
  theme: 'dark',
  language: 'ru',
  currency: 'BYN',
  products: getInitialProducts(),
  reviews: [],
  cart: [],
  favorites: [],
  priceAlerts: [],
  orders: [],
  mailbox: [],
  toasts: [],
  cartOpen: false,
  assistantOpen: false,
  checkoutOpen: false,
  authModalOpen: false,
  adminModalOpen: false,
  mailboxOpen: false,
  profileOpen: false,
  favoritesOpen: false,
  user: null,
  isAdmin: false,
  unreadMail: 0,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    case 'SET_THEME': return { ...state, theme: action.payload };
    case 'SET_LANGUAGE': return { ...state, language: action.payload };
    case 'SET_CURRENCY': return { ...state, currency: action.payload };
    case 'LOGIN_USER': return { ...state, user: action.payload, isAdmin: false, authModalOpen: false };
    case 'LOGIN_ADMIN': return { ...state, isAdmin: true, adminModalOpen: false, user: { name: 'Admin', email: 'admin@weezly.com' } };
    case 'LOGOUT': return { ...state, user: null, isAdmin: false, cart: [], priceAlerts: [], favorites: [] };
    case 'UPDATE_USER': return { ...state, user: state.user ? { ...state.user, ...action.payload } : null };
    case 'ADD_TO_CART': {
      const { product, warrantyLevel = 'none' } = action.payload;
      const existing = state.cart.find(i => i.product.id === product.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(i =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...state, cart: [...state.cart, { product, quantity: 1, warrantyLevel }] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(i => i.product.id !== action.payload) };
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(i =>
          i.product.id === action.payload.productId
            ? { ...i, quantity: Math.max(1, action.payload.quantity) }
            : i
        ),
      };
    case 'UPDATE_CART_WARRANTY':
      return {
        ...state,
        cart: state.cart.map(i =>
          i.product.id === action.payload.productId
            ? { ...i, warrantyLevel: action.payload.warrantyLevel }
            : i
        ),
      };
    case 'CLEAR_CART': return { ...state, cart: [] };
    case 'SET_CART_OPEN': return { ...state, cartOpen: action.payload };
    case 'SET_ASSISTANT_OPEN': return { ...state, assistantOpen: action.payload };
    case 'SET_CHECKOUT_OPEN': return { ...state, checkoutOpen: action.payload };
    case 'SET_AUTH_MODAL_OPEN': return { ...state, authModalOpen: action.payload };
    case 'SET_ADMIN_MODAL_OPEN': return { ...state, adminModalOpen: action.payload };
    case 'SET_MAILBOX_OPEN': return { ...state, mailboxOpen: action.payload };
    case 'SET_PROFILE_OPEN': return { ...state, profileOpen: action.payload };
    case 'SET_FAVORITES_OPEN': return { ...state, favoritesOpen: action.payload };
    case 'ADD_PRICE_ALERT':
      return {
        ...state,
        priceAlerts: [
          ...state.priceAlerts.filter(a => a.productId !== action.payload.productId),
          action.payload,
        ],
      };
    case 'REMOVE_PRICE_ALERT':
      return { ...state, priceAlerts: state.priceAlerts.filter(a => a.productId !== action.payload) };
    case 'UPDATE_PRODUCT_PRICE':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.productId
            ? { ...p, price: action.payload.newPrice, discount: action.payload.discount, originalPrice: action.payload.discount > 0 ? p.originalPrice ?? p.price : undefined }
            : p
        ),
        cart: state.cart.map(i =>
          i.product.id === action.payload.productId
            ? { ...i, product: { ...i.product, price: action.payload.newPrice, discount: action.payload.discount } }
            : i
        ),
      };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'ADD_REVIEW': {
      const newReview = action.payload;
      const productReviews = [...state.reviews.filter(r => r.productId === newReview.productId), newReview];
      const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
      return {
        ...state,
        reviews: [...state.reviews.filter(r => r.productId !== newReview.productId), newReview],
        products: state.products.map(p =>
          p.id === newReview.productId
            ? { ...p, rating: Math.round(avgRating * 10) / 10, reviewCount: productReviews.length }
            : p
        ),
      };
    }
    case 'ADD_MAIL':
      return {
        ...state,
        mailbox: [action.payload, ...state.mailbox],
        unreadMail: state.unreadMail + 1,
      };
    case 'MARK_MAIL_READ':
      return {
        ...state,
        mailbox: state.mailbox.map(m => m.id === action.payload ? { ...m, read: true } : m),
        unreadMail: Math.max(0, state.unreadMail - (state.mailbox.find(m => m.id === action.payload && !m.read) ? 1 : 0)),
      };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'TRIGGER_ALERT':
      return {
        ...state,
        priceAlerts: state.priceAlerts.map(a =>
          a.productId === action.payload ? { ...a, triggered: true } : a
        ),
      };
    case 'TOGGLE_FAVORITE': {
      const productId = action.payload;
      const isFavorite = state.favorites.includes(productId);
      return {
        ...state,
        favorites: isFavorite
          ? state.favorites.filter(id => id !== productId)
          : [...state.favorites, productId],
      };
    }
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  t: (key: keyof typeof translations.en) => string;
  formatPrice: (usdPrice: number) => string;
  convertPrice: (usdPrice: number) => number;
  cartTotal: number;
  cartCount: number;
  isLoggedIn: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = loadFromStorage();
    if (Object.keys(savedState).length > 0) {
      dispatch({ type: 'LOAD_STATE', payload: savedState });
    }
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    saveToStorage(state);
  }, [state.theme, state.language, state.currency, state.user, state.isAdmin, state.cart, state.favorites, state.priceAlerts, state.orders, state.reviews, state.mailbox, state.unreadMail, state.products]);

  const t = useCallback((key: keyof typeof translations.en): string => {
    return (translations[state.language] as Record<string, string>)[key] ?? translations.en[key] ?? key;
  }, [state.language]);

  const convertPrice = useCallback((usdPrice: number): number => {
    if (state.currency === 'USD') return usdPrice;
    return Math.round(usdPrice * USD_TO_BYN * 100) / 100;
  }, [state.currency]);

  const formatPrice = useCallback((usdPrice: number): string => {
    const converted = convertPrice(usdPrice);
    if (state.currency === 'USD') return `$${converted.toFixed(2)}`;
    return `${converted.toFixed(2)} BYN`;
  }, [convertPrice, state.currency]);

  const cartTotal = state.cart.reduce((sum, item) => {
    const warrantyPrice = getWarrantyPrice(item.product, item.warrantyLevel);
    return sum + (item.product.price + warrantyPrice) * item.quantity;
  }, 0);

  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const isLoggedIn = state.user !== null;

  // Price simulator
  const alertsRef = useRef(state.priceAlerts);
  const productsRef = useRef(state.products);
  const currentUserRef = useRef(state.user);
  alertsRef.current = state.priceAlerts;
  productsRef.current = state.products;
  currentUserRef.current = state.user;

  useEffect(() => {
    const interval = setInterval(() => {
      const products = productsRef.current;
      if (products.length === 0) return;
      const numSales = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...products].sort(() => Math.random() - 0.5).slice(0, numSales);
      shuffled.forEach(product => {
        const discountPct = Math.floor(Math.random() * 15) + 3;
        const newPrice = Math.round(product.price * (1 - discountPct / 100) * 100) / 100;
        dispatch({ type: 'UPDATE_PRODUCT_PRICE', payload: { productId: product.id, newPrice, discount: discountPct } });

        const alerts = alertsRef.current;
        const alert = alerts.find(a => a.productId === product.id && !a.triggered);
        if (alert && newPrice <= alert.targetPrice) {
          dispatch({ type: 'TRIGGER_ALERT', payload: product.id });
          const toastId = `toast-${Date.now()}-${product.id}`;
          dispatch({
            type: 'ADD_TOAST',
            payload: {
              id: toastId,
              title: state.language === 'ru' ? 'Цена снизилась!' : state.language === 'be' ? 'Цана знізілася!' : 'Price Dropped!',
              message: `${product.nameRu} — ${state.currency === 'USD' ? `$${newPrice.toFixed(2)}` : `${(newPrice * USD_TO_BYN).toFixed(2)} BYN`}`,
              type: 'success',
              productId: product.id,
            },
          });
          dispatch({
            type: 'ADD_MAIL',
            payload: {
              id: `mail-${Date.now()}-${product.id}`,
              subject: state.language === 'ru' ? 'Цена снижена! Специальное предложение' : state.language === 'be' ? 'Цана знізілася! Спецыяльная прапанова' : 'Price Drop! Special Offer',
              from: 'WEEZLY Platform <noreply@weezly.com>',
              body: state.language === 'ru'
                ? `Уважаемый пользователь,\n\nВы отслеживали товар "${product.nameRu}".\n\nЦена снизилась до ${state.currency === 'USD' ? `$${newPrice.toFixed(2)}` : `${(newPrice * USD_TO_BYN).toFixed(2)} BYN`} (скидка ${discountPct}%).\n\nНажмите кнопку ниже, чтобы перейти к покупке.\n\nС уважением,\nКоманда WEEZLY`
                : state.language === 'be'
                ? `Шаноўны карыстальнік,\n\nВы адсочвалі тавар "${product.nameBe}".\n\nЦана знізілася да ${state.currency === 'USD' ? `$${newPrice.toFixed(2)}` : `${(newPrice * USD_TO_BYN).toFixed(2)} BYN`} (зніжка ${discountPct}%).\n\nНацісніце кнопку ніжэй, каб перайсці да пакупкі.\n\nЗ павагай,\nКаманда WEEZLY`
                : `Dear Customer,\n\nYou were tracking "${product.nameEn}".\n\nPrice dropped to ${state.currency === 'USD' ? `$${newPrice.toFixed(2)}` : `${(newPrice * USD_TO_BYN).toFixed(2)} BYN`} (${discountPct}% off).\n\nClick the button below to proceed with purchase.\n\nBest regards,\nWEEZLY Team`,
              date: new Date().toISOString(),
              productId: product.id,
              read: false,
            },
          });

          const userRef = currentUserRef.current;
          if (userRef?.email) {
            sendEmail({
              to: userRef.email,
              type: 'priceDrop',
              language: state.language,
              data: {
                productName: state.language === 'ru' ? product.nameRu : state.language === 'be' ? product.nameBe : product.nameEn,
                oldPrice: state.currency === 'USD' ? `$${(product.originalPrice || product.price).toFixed(2)}` : `${((product.originalPrice || product.price) * USD_TO_BYN).toFixed(2)} BYN`,
                newPrice: state.currency === 'USD' ? `$${newPrice.toFixed(2)}` : `${(newPrice * USD_TO_BYN).toFixed(2)} BYN`,
                discount: discountPct,
                productUrl: `${window.location.origin}/product/${product.id}`,
              },
            }).catch(err => console.error('Failed to send price drop email:', err));
          }

          setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: toastId }), 6000);
        }
      });
    }, 35000);
    return () => clearInterval(interval);
  }, [state.currency, state.language]);

  return (
    <AppContext.Provider value={{ state, dispatch, t, formatPrice, convertPrice, cartTotal, cartCount, isLoggedIn }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
