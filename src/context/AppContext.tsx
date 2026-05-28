import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { Language, Currency, USD_TO_BYN, translations } from '../data/translations';
import { Product, WarrantyLevel, getWarrantyPrice } from '../data/products';
import {
  User, login as apiLogin, register as apiRegister, adminLogin as apiAdminLogin,
  getCurrentUser, updateProfile as apiUpdateProfile,
  getProducts, createProduct as apiCreateProduct, updateProduct as apiUpdateProduct, deleteProduct as apiDeleteProduct,
  getReviews, createReview as apiCreateReview,
  getFavorites, toggleFavorite as apiToggleFavorite,
  getOrders, createOrder as apiCreateOrder, updateOrderStatus,
  getPriceAlerts, createPriceAlert, deletePriceAlert,
  Product as ApiProduct, Review as ApiReview, Order as ApiOrder
} from '../api';
import { sendEmail } from '../api';

export type Theme = 'dark' | 'light';

export interface CartItem {
  product: Product;
  quantity: number;
  warrantyLevel: WarrantyLevel;
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

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  productId?: number;
}

export interface AppState {
  theme: Theme;
  language: Language;
  currency: Currency;
  products: Product[];
  reviews: Record<number, { productId: number; authorName: string; rating: number; comment: string; createdAt: string }[]>;
  cart: CartItem[];
  favorites: number[];
  priceAlerts: { productId: number; targetPrice: number; triggered: boolean }[];
  orders: Order[];
  toasts: Toast[];
  cartOpen: boolean;
  assistantOpen: boolean;
  checkoutOpen: boolean;
  authModalOpen: boolean;
  adminModalOpen: boolean;
  mailboxOpen: boolean;
  profileOpen: boolean;
  favoritesOpen: boolean;
  user: { id: string; email: string; name: string; role: string; phone?: string; address?: string; city?: string; zip_code?: string; country?: string } | null;
  isAdmin: boolean;
  token: string | null;
  loading: boolean;
}

type Action =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'LOGIN_USER'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ADMIN'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_TOKEN'; payload: string | null }
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
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_FAVORITES'; payload: number[] }
  | { type: 'ADD_FAVORITE'; payload: number }
  | { type: 'REMOVE_FAVORITE'; payload: number }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'SET_REVIEWS'; payload: { productId: number; reviews: any[] } }
  | { type: 'SET_PRICE_ALERTS'; payload: { productId: number; targetPrice: number; triggered: boolean }[] }
  | { type: 'UPDATE_PRODUCT_PRICE'; payload: { productId: number; newPrice: number; discount: number } }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

const STORAGE_KEY = 'weezly_state';
const AUTH_KEY = 'weezly_auth';

const loadAuthFromStorage = (): { token: string | null; user: User | null } => {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load auth from storage:', e);
  }
  return { token: null, user: null };
};

const saveAuthToStorage = (token: string | null, user: User | null) => {
  try {
    if (token && user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch (e) {
    console.error('Failed to save auth:', e);
  }
};

const loadSettingsFromStorage = (): Partial<AppState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        theme: parsed.theme || 'dark',
        language: parsed.language || 'ru',
        currency: parsed.currency || 'BYN',
      };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return {};
};

const saveSettingsToStorage = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      theme: state.theme,
      language: state.language,
      currency: state.currency,
    }));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

const initialState: AppState = {
  theme: 'dark',
  language: 'ru',
  currency: 'BYN',
  products: [],
  reviews: {},
  cart: [],
  favorites: [],
  priceAlerts: [],
  orders: [],
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
  token: null,
  loading: true,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_THEME': return { ...state, theme: action.payload };
    case 'SET_LANGUAGE': return { ...state, language: action.payload };
    case 'SET_CURRENCY': return { ...state, currency: action.payload };
    case 'LOGIN_USER': return {
      ...state,
      user: action.payload.user,
      token: action.payload.token,
      isAdmin: action.payload.user.role === 'admin',
      authModalOpen: false,
    };
    case 'LOGIN_ADMIN': return {
      ...state,
      user: action.payload.user,
      token: action.payload.token,
      isAdmin: true,
      adminModalOpen: false,
    };
    case 'LOGOUT': return { ...state, user: null, isAdmin: false, token: null, cart: [], favorites: [], priceAlerts: [], orders: [] };
    case 'UPDATE_USER': return { ...state, user: state.user ? { ...state.user, ...action.payload } : null };
    case 'SET_TOKEN': return { ...state, token: action.payload };
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
    case 'SET_PRODUCTS': return { ...state, products: action.payload };
    case 'SET_FAVORITES': return { ...state, favorites: action.payload };
    case 'ADD_FAVORITE': return { ...state, favorites: [...state.favorites, action.payload] };
    case 'REMOVE_FAVORITE': return { ...state, favorites: state.favorites.filter(id => id !== action.payload) };
    case 'SET_ORDERS': return { ...state, orders: action.payload };
    case 'ADD_ORDER': return { ...state, orders: [action.payload, ...state.orders] };
    case 'SET_REVIEWS': return { ...state, reviews: { ...state.reviews, [action.payload.productId]: action.payload.reviews } };
    case 'SET_PRICE_ALERTS': return { ...state, priceAlerts: action.payload };
    case 'UPDATE_PRODUCT_PRICE':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.productId
            ? { ...p, price: action.payload.newPrice, discount: action.payload.discount, originalPrice: action.payload.discount > 0 ? p.price : p.originalPrice }
            : p
        ),
      };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
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
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  toggleFavorite: (productId: number) => Promise<void>;
  addReview: (productId: number, rating: number, comment: string) => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  submitOrder: (orderData: any) => Promise<string | null>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load settings from storage
  useEffect(() => {
    const settings = loadSettingsFromStorage();
    if (settings.theme) dispatch({ type: 'SET_THEME', payload: settings.theme });
    if (settings.language) dispatch({ type: 'SET_LANGUAGE', payload: settings.language });
    if (settings.currency) dispatch({ type: 'SET_CURRENCY', payload: settings.currency });
  }, []);

  // Save settings on change
  useEffect(() => {
    saveSettingsToStorage(state);
  }, [state.theme, state.language, state.currency]);

  // Check for existing auth token and validate
  useEffect(() => {
    const initAuth = async () => {
      const { token, user } = loadAuthFromStorage();
      if (token) {
        dispatch({ type: 'SET_TOKEN', payload: token });
        const result = await getCurrentUser();
        if (result.success && result.user) {
          dispatch({
            type: 'LOGIN_USER',
            payload: { user: result.user as User, token },
          });
          // Fetch user data
          await fetchFavorites();
          await fetchOrders();
          await fetchPriceAlerts();
        } else {
          saveAuthToStorage(null, null);
        }
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    // Load products
    fetchProducts();
    initAuth();
  }, []);

  const fetchProducts = useCallback(async () => {
    const result = await getProducts();
    if (result.success && result.products) {
      dispatch({ type: 'SET_PRODUCTS', payload: result.products.map(p => ({
        id: p.id,
        nameRu: p.name_ru,
        nameBe: p.name_be,
        nameEn: p.name_en,
        descRu: p.desc_ru,
        descBe: p.desc_be,
        descEn: p.desc_en,
        price: p.price,
        originalPrice: p.original_price,
        category: p.category as any,
        brand: p.brand,
        rating: p.rating,
        reviewCount: p.review_count,
        stock: p.stock,
        image: p.image,
        tags: p.tags,
        specs: p.specs,
        mtbf: p.mtbf,
        discount: p.discount,
      })) as Product[] });
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    const result = await getFavorites();
    if (result.success && result.favoriteIds) {
      dispatch({ type: 'SET_FAVORITES', payload: result.favoriteIds });
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    const result = await getOrders();
    if (result.success && result.orders) {
      const orders: Order[] = result.orders.map(o => ({
        id: o.id,
        items: o.order_items.map(oi => ({
          product: { id: oi.product_id, price: oi.price } as any,
          quantity: oi.quantity,
          warrantyLevel: oi.warranty_level as WarrantyLevel,
        })),
        total: o.total,
        currency: o.currency as Currency,
        date: o.created_at,
        status: o.status as any,
        address: {
          firstName: o.first_name,
          lastName: o.last_name,
          email: o.email,
          phone: o.phone || '',
          address: o.address,
          city: o.city,
          zipCode: o.zip_code || '',
          country: o.country,
        },
      }));
      dispatch({ type: 'SET_ORDERS', payload: orders });
    }
  }, []);

  const fetchPriceAlerts = useCallback(async () => {
    const result = await getPriceAlerts();
    if (result.success && result.alerts) {
      dispatch({ type: 'SET_PRICE_ALERTS', payload: result.alerts.map(a => ({
        productId: a.product_id,
        targetPrice: a.target_price,
        triggered: a.triggered,
      })) });
    }
  }, []);

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

  const loginUser = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result.success && result.user && result.token) {
      dispatch({ type: 'LOGIN_USER', payload: { user: result.user, token: result.token } });
      saveAuthToStorage(result.token, result.user);
      await fetchFavorites();
      await fetchOrders();
      await fetchPriceAlerts();
      return { success: true };
    }
    return { success: false, error: result.error || 'Login failed' };
  }, []);

  const registerUser = useCallback(async (email: string, password: string, name: string) => {
    const result = await apiRegister(email, password, name);
    if (result.success && result.user && result.token) {
      dispatch({ type: 'LOGIN_USER', payload: { user: result.user, token: result.token } });
      saveAuthToStorage(result.token, result.user);
      return { success: true };
    }
    return { success: false, error: result.error || 'Registration failed' };
  }, []);

  const loginAdmin = useCallback(async (username: string, password: string) => {
    const result = await apiAdminLogin(username, password);
    if (result.success && result.user && result.token) {
      dispatch({ type: 'LOGIN_ADMIN', payload: { user: result.user, token: result.token } });
      saveAuthToStorage(result.token, result.user);
      return { success: true };
    }
    return { success: false, error: result.error || 'Admin login failed' };
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
    saveAuthToStorage(null, null);
  }, []);

  const toggleFavorite = useCallback(async (productId: number) => {
    if (!state.user) return;
    const result = await apiToggleFavorite(productId);
    if (result.success) {
      if (result.action === 'added') {
        dispatch({ type: 'ADD_FAVORITE', payload: productId });
      } else {
        dispatch({ type: 'REMOVE_FAVORITE', payload: productId });
      }
    }
  }, [state.user]);

  const addReview = useCallback(async (productId: number, rating: number, comment: string) => {
    if (!state.user) return;
    const result = await apiCreateReview(productId, rating, comment);
    if (result.success) {
      await fetchProducts(); // Refresh to get updated rating
    }
  }, [state.user]);

  const submitOrder = useCallback(async (orderData: any): Promise<string | null> => {
    const result = await apiCreateOrder(orderData);
    if (result.success && result.orderId) {
      await fetchOrders();
      return result.orderId;
    }
    return null;
  }, []);

  // Price simulator (keeps running for demo)
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.products.length === 0) return;
      const numSales = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...state.products].sort(() => Math.random() - 0.5).slice(0, numSales);
      shuffled.forEach(product => {
        const discountPct = Math.floor(Math.random() * 15) + 3;
        const newPrice = Math.round(product.price * (1 - discountPct / 100) * 100) / 100;
        dispatch({ type: 'UPDATE_PRODUCT_PRICE', payload: { productId: product.id, newPrice, discount: discountPct } });
      });
    }, 45000);
    return () => clearInterval(interval);
  }, [state.products]);

  return (
    <AppContext.Provider value={{
      state, dispatch, t, formatPrice, convertPrice, cartTotal, cartCount, isLoggedIn,
      loginUser, registerUser, loginAdmin, logout, toggleFavorite, addReview, fetchProducts, fetchOrders, submitOrder
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
