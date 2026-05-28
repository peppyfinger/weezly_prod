const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
function getAuthToken(): string | null {
  const authState = localStorage.getItem('weezly_auth');
  if (authState) {
    try {
      const parsed = JSON.parse(authState);
      return parsed.token;
    } catch {
      return null;
    }
  }
  return null;
}

// Headers with auth
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ==================== AUTH API ====================

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  country?: string;
}

export async function register(email: string, password: string, name: string): Promise<{
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function login(email: string, password: string): Promise<{
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function adminLogin(username: string, password: string): Promise<{
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return await response.json();
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function getCurrentUser(): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Get current user error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function updateProfile(data: Partial<User>): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ==================== PRODUCTS API ====================

export interface Product {
  id: number;
  name_ru: string;
  name_be: string;
  name_en: string;
  desc_ru: string;
  desc_be: string;
  desc_en: string;
  price: number;
  original_price?: number;
  category: string;
  brand: string;
  rating: number;
  review_count: number;
  stock: number;
  image: string;
  tags: string[];
  specs: Record<string, string>;
  mtbf: number;
  discount?: number;
}

export async function getProducts(filters?: {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}): Promise<{
  success: boolean;
  products?: Product[];
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.search) params.append('search', filters.search);

    const response = await fetch(`${API_BASE}/products?${params}`);
    return await response.json();
  } catch (error) {
    console.error('Get products error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function getProduct(id: number): Promise<{
  success: boolean;
  product?: Product;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/products/${id}`);
    return await response.json();
  } catch (error) {
    console.error('Get product error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function createProduct(product: Partial<Product>): Promise<{
  success: boolean;
  product?: Product;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(product),
    });
    return await response.json();
  } catch (error) {
    console.error('Create product error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function updateProduct(id: number, updates: Partial<Product>): Promise<{
  success: boolean;
  product?: Product;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return await response.json();
  } catch (error) {
    console.error('Update product error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function deleteProduct(id: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Delete product error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ==================== REVIEWS API ====================

export interface Review {
  id: string;
  product_id: number;
  user_id?: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export async function getReviews(productId: number): Promise<{
  success: boolean;
  reviews?: Review[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/reviews/${productId}`);
    return await response.json();
  } catch (error) {
    console.error('Get reviews error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function createReview(productId: number, rating: number, comment: string): Promise<{
  success: boolean;
  review?: Review;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ productId, rating, comment }),
    });
    return await response.json();
  } catch (error) {
    console.error('Create review error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ==================== FAVORITES API ====================

export async function getFavorites(): Promise<{
  success: boolean;
  favorites?: Product[];
  favoriteIds?: number[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/favorites`, {
      headers: getHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Get favorites error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function toggleFavorite(productId: number): Promise<{
  success: boolean;
  action?: 'added' | 'removed';
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/favorites/${productId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ==================== ORDERS API ====================

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  warranty_level: string;
  warranty_price: number;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  currency: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  zip_code?: string;
  country: string;
  created_at: string;
  order_items: OrderItem[];
}

export async function getOrders(): Promise<{
  success: boolean;
  orders?: Order[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/orders`, {
      headers: getHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Get orders error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function createOrder(order: {
  items: any[];
  total: number;
  currency: string;
  shipping: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };
}): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(order),
    });
    return await response.json();
  } catch (error) {
    console.error('Create order error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return await response.json();
  } catch (error) {
    console.error('Update order status error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ==================== PRICE ALERTS API ====================

export interface PriceAlert {
  id: string;
  user_id: string;
  product_id: number;
  target_price: number;
  triggered: boolean;
  products?: Product;
}

export async function getPriceAlerts(): Promise<{
  success: boolean;
  alerts?: PriceAlert[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/price-alerts`, {
      headers: getHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Get price alerts error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function createPriceAlert(productId: number, targetPrice: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/price-alerts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ productId, targetPrice }),
    });
    return await response.json();
  } catch (error) {
    console.error('Create price alert error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function deletePriceAlert(productId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/price-alerts/${productId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Delete price alert error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ==================== PAYMENTS API ====================

export async function createPaymentIntent(checkout: {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  description?: string;
}): Promise<{
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkout),
    });
    return await response.json();
  } catch (error) {
    console.error('Create payment intent error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ==================== EMAIL API ====================

export async function sendEmail(notification: {
  to: string;
  type: 'priceDrop' | 'orderConfirmation' | 'passwordReset';
  language: 'ru' | 'be' | 'en';
  data: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });
    return await response.json();
  } catch (error) {
    console.error('Send email error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ==================== HEALTH CHECK ====================

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}
