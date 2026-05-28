import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Initialize Supabase client (service role for backend)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'weezly-jwt-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Auth middleware
interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    // Verify user exists in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Email transporter setup
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// ==================== AUTH ENDPOINTS ====================

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (authError) {
      // If Supabase auth fails, create manually with hashed password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert into users table
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          email,
          name,
          role: 'user',
        })
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({ error: 'Failed to create user', details: insertError.message });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
        token,
      });
    }

    // User created via Supabase Auth
    if (authData.user) {
      // Create profile in users table
      await supabase.from('users').insert({
        id: authData.user.id,
        email,
        name,
        role: 'user',
      });

      const token = jwt.sign(
        { id: authData.user.id, email, role: 'user' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        user: { id: authData.user.id, email, name, role: 'user' },
        token,
      });
    }

    res.status(500).json({ error: 'Failed to create user' });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Try Supabase Auth login first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    const user = userProfile || {
      id: authData.user.id,
      email: authData.user.email,
      name: authData.user.user_metadata?.name || email.split('@')[0],
      role: 'user',
    };

    // Generate our JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, address: user.address, city: user.city, country: user.country },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Admin login
app.post('/api/auth/admin-login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Hardcoded admin credentials for demo (in production, use database)
  if (username === 'admin' && password === 'admin123') {
    const adminUser = {
      id: 'admin-00000000-0000-0000-0000-000000000001',
      email: 'admin@weezly.com',
      name: 'Admin',
      role: 'admin',
    };

    // Ensure admin exists in database
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('id', adminUser.id)
      .single();

    if (!existingAdmin) {
      await supabase.from('users').insert(adminUser);
    }

    const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      user: adminUser,
      token,
    });
  }

  res.status(401).json({ error: 'Invalid admin credentials' });
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { data: user } = await supabase
    .from('users')
    .select('id, email, name, phone, address, city, zip_code, country, role')
    .eq('id', req.user!.id)
    .single();

  res.json({ user });
});

// Update user profile
app.put('/api/auth/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, phone, address, city, zipCode, country } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .update({
      name,
      phone,
      address,
      city,
      zip_code: zipCode,
      country,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.user!.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }

  res.json({ success: true, user });
});

// ==================== PRODUCTS ENDPOINTS ====================

// Get all products
app.get('/api/products', async (req: Request, res: Response) => {
  const { category, brand, minPrice, maxPrice, search } = req.query;

  let query = supabase.from('products').select('*');

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  if (brand) {
    query = query.eq('brand', brand);
  }
  if (minPrice) {
    query = query.gte('price', parseFloat(minPrice as string));
  }
  if (maxPrice) {
    query = query.lte('price', parseFloat(maxPrice as string));
  }
  if (search) {
    query = query.or(`name_ru.ilike.%${search}%,name_en.ilike.%${search}%,name_be.ilike.%${search}%`);
  }

  const { data: products, error } = await query.order('id');

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }

  res.json({ products });
});

// Get single product
app.get('/api/products/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ product });
});

// Update product (admin only)
app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const { data: product, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update product', details: error.message });
  }

  res.json({ success: true, product });
});

// Create product (admin only)
app.post('/api/products', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { data: product, error } = await supabase
    .from('products')
    .insert(req.body)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to create product', details: error.message });
  }

  res.json({ success: true, product });
});

// Delete product (admin only)
app.delete('/api/products/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }

  res.json({ success: true });
});

// ==================== REVIEWS ENDPOINTS ====================

// Get reviews for product
app.get('/api/reviews/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch reviews', details: error.message });
  }

  res.json({ reviews: reviews || [] });
});

// Create review
app.post('/api/reviews', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { productId, rating, comment } = req.body;

  if (!productId || !rating || !comment) {
    return res.status(400).json({ error: 'Product ID, rating, and comment are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  // Get user name
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', req.user!.id)
    .single();

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      product_id: productId,
      user_id: req.user!.id,
      author_name: user?.name || 'Anonymous',
      rating,
      comment,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to create review', details: error.message });
  }

  res.json({ success: true, review });
});

// ==================== FAVORITES ENDPOINTS ====================

// Get user favorites
app.get('/api/favorites', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { data: favorites, error } = await supabase
    .from('favorites')
    .select('product_id, products(*)')
    .eq('user_id', req.user!.id);

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch favorites', details: error.message });
  }

  const products = favorites?.map(f => f.products).filter(Boolean) || [];
  res.json({ favorites: products, favoriteIds: favorites?.map(f => f.product_id) || [] });
});

// Toggle favorite
app.post('/api/favorites/:productId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;

  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', req.user!.id)
    .eq('product_id', productId)
    .single();

  if (existing) {
    // Remove from favorites
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to remove favorite', details: error.message });
    }

    return res.json({ success: true, action: 'removed' });
  }

  // Add to favorites
  const { error } = await supabase.from('favorites').insert({
    user_id: req.user!.id,
    product_id: parseInt(productId),
  });

  if (error) {
    return res.status(500).json({ error: 'Failed to add favorite', details: error.message });
  }

  res.json({ success: true, action: 'added' });
});

// ==================== ORDERS ENDPOINTS ====================

// Get user orders
app.get('/api/orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }

  res.json({ orders: orders || [] });
});

// Create order
app.post('/api/orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { items, total, currency, shipping } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain items' });
  }

  const orderId = crypto.randomUUID();

  // Create order
  const { error: orderError } = await supabase.from('orders').insert({
    id: orderId,
    user_id: req.user!.id,
    total,
    currency,
    status: 'processing',
    first_name: shipping.firstName,
    last_name: shipping.lastName,
    email: shipping.email,
    phone: shipping.phone,
    address: shipping.address,
    city: shipping.city,
    zip_code: shipping.zipCode,
    country: shipping.country,
  });

  if (orderError) {
    return res.status(500).json({ error: 'Failed to create order', details: orderError.message });
  }

  // Create order items
  const orderItems = items.map((item: any) => ({
    order_id: orderId,
    product_id: item.product.id,
    product_name: item.product.name_ru,
    quantity: item.quantity,
    price: item.product.price,
    warranty_level: item.warrantyLevel,
    warranty_price: item.warrantyPrice || 0,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) {
    return res.status(500).json({ error: 'Failed to create order items', details: itemsError.message });
  }

  res.json({ success: true, orderId });
});

// Update order status (admin only)
app.put('/api/orders/:id/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Failed to update order status', details: error.message });
  }

  res.json({ success: true });
});

// ==================== PRICE ALERTS ENDPOINTS ====================

// Get user price alerts
app.get('/api/price-alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { data: alerts, error } = await supabase
    .from('price_alerts')
    .select('*, products(id, name_ru, name_be, name_en, price, image)')
    .eq('user_id', req.user!.id);

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch price alerts', details: error.message });
  }

  res.json({ alerts: alerts || [] });
});

// Create price alert
app.post('/api/price-alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { productId, targetPrice } = req.body;

  // Delete existing alert for this product
  await supabase
    .from('price_alerts')
    .delete()
    .eq('user_id', req.user!.id)
    .eq('product_id', productId);

  const { error } = await supabase.from('price_alerts').insert({
    user_id: req.user!.id,
    product_id: productId,
    target_price: targetPrice,
  });

  if (error) {
    return res.status(500).json({ error: 'Failed to create price alert', details: error.message });
  }

  res.json({ success: true });
});

// Delete price alert
app.delete('/api/price-alerts/:productId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;

  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('user_id', req.user!.id)
    .eq('product_id', productId);

  if (error) {
    return res.status(500).json({ error: 'Failed to delete price alert', details: error.message });
  }

  res.json({ success: true });
});

// ==================== PAYMENTS ENDPOINTS ====================

// Currency conversion: BYN to USD
const BYN_TO_USD_RATE = 0.31;

app.post('/api/payments/create-intent', async (req: Request, res: Response) => {
  const { amount, currency, orderId, customerEmail, description } = req.body;

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_your_secret_key_here') {
    return res.json({
      success: true,
      clientSecret: `demo_secret_${Date.now()}`,
      paymentIntentId: `pi_demo_${Date.now()}`,
      message: 'Stripe not configured, using demo mode',
    });
  }

  try {
    let amountInUsd = amount;
    let stripeCurrency = 'usd';

    if (currency === 'BYN') {
      amountInUsd = amount * BYN_TO_USD_RATE;
    }

    const amountInCents = Math.round(amountInUsd * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: stripeCurrency,
      metadata: {
        orderId,
        customerEmail,
        originalAmount: amount.toString(),
        originalCurrency: currency,
      },
      description: description || `WEEZLY Order ${orderId}`,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      currency: stripeCurrency,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent',
      details: error.message
    });
  }
});

// ==================== EMAIL ENDPOINTS ====================

app.post('/api/notifications/send', async (req: Request, res: Response) => {
  const { to, type, language, data } = req.body;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.json({
      success: true,
      message: 'SMTP not configured, email would be sent',
    });
  }

  try {
    const transporter = createTransporter();

    // Simple email templates
    const subjects: Record<string, Record<string, string>> = {
      orderConfirmation: {
        ru: `WEEZLY: Заказ подтверждён`,
        be: `WEEZLY: Замова пацверджана`,
        en: `WEEZLY: Order Confirmed`,
      },
      priceDrop: {
        ru: 'WEEZLY Alert: Цена снижена!',
        be: 'WEEZLY Alert: Цана знізілася!',
        en: 'WEEZLY Alert: Price Dropped!',
      },
      passwordReset: {
        ru: 'WEEZLY: Код восстановления пароля',
        be: 'WEEZLY: Код аднаўлення пароля',
        en: 'WEEZLY: Password Reset Code',
      },
    };

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'WEEZLY <noreply@weezly.com>',
      to,
      subject: subjects[type]?.[language] || subjects[type]?.en || 'WEEZLY Notification',
      html: `<p>${JSON.stringify(data)}</p>`,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`WEEZLY Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
