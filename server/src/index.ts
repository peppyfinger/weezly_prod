import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

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

// Email templates
const emailTemplates = {
  priceDrop: {
    ru: (data: { productName: string; oldPrice: string; newPrice: string; discount: number; productUrl: string }) => ({
      subject: 'WEEZLY Alert: Цена снижена!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            .logo { font-size: 24px; font-weight: bold; color: #06b6d4; margin-bottom: 24px; }
            .title { color: #ffffff; font-size: 20px; margin-bottom: 16px; }
            .discount { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; padding: 8px 16px; border-radius: 8px; display: inline-block; font-weight: bold; margin-bottom: 16px; }
            .product-name { color: #e2e8f0; font-size: 16px; margin-bottom: 8px; }
            .price-row { display: flex; gap: 16px; margin: 16px 0; }
            .old-price { color: #94a3b8; text-decoration: line-through; }
            .new-price { color: #10b981; font-size: 24px; font-weight: bold; }
            .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 24px; }
            .footer { color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">WEEZLY</div>
            <div class="title">Отличные новости! Цена снизилась!</div>
            <div class="discount">-${data.discount}%</div>
            <div class="product-name">${data.productName}</div>
            <div class="price-row">
              <span class="old-price">${data.oldPrice}</span>
              <span class="new-price">${data.newPrice}</span>
            </div>
            <p style="color: #94a3b8;">Вы отслеживали этот товар, и теперь его цена достигла вашего целевого уровня!</p>
            <a href="${data.productUrl}" class="btn">Купить сейчас</a>
            <div class="footer">
              <p>WEEZLY Platform © 2024</p>
              <p>Вы получили это письмо, потому что подписались на уведомление о снижении цены.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
    be: (data: { productName: string; oldPrice: string; newPrice: string; discount: number; productUrl: string }) => ({
      subject: 'WEEZLY Alert: Цана знізілася!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            .logo { font-size: 24px; font-weight: bold; color: #06b6d4; margin-bottom: 24px; }
            .title { color: #ffffff; font-size: 20px; margin-bottom: 16px; }
            .discount { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; padding: 8px 16px; border-radius: 8px; display: inline-block; font-weight: bold; margin-bottom: 16px; }
            .product-name { color: #e2e8f0; font-size: 16px; margin-bottom: 8px; }
            .price-row { display: flex; gap: 16px; margin: 16px 0; }
            .old-price { color: #94a3b8; text-decoration: line-through; }
            .new-price { color: #10b981; font-size: 24px; font-weight: bold; }
            .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 24px; }
            .footer { color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">WEEZLY</div>
            <div class="title">Выдатныя навіны! Цана знізілася!</div>
            <div class="discount">-${data.discount}%</div>
            <div class="product-name">${data.productName}</div>
            <div class="price-row">
              <span class="old-price">${data.oldPrice}</span>
              <span class="new-price">${data.newPrice}</span>
            </div>
            <p style="color: #94a3b8;">Вы адсочвалі гэты тавар, і цяпер яго цана дасягнула вашага мэтавага ўзроўню!</p>
            <a href="${data.productUrl}" class="btn">Купіць цяпер</a>
            <div class="footer">
              <p>WEEZLY Platform © 2024</p>
              <p>Вы атрымалі гэты ліст, таму што падпісаліся на паведамленне аб зніжэнні цаны.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
    en: (data: { productName: string; oldPrice: string; newPrice: string; discount: number; productUrl: string }) => ({
      subject: 'WEEZLY Alert: Price Dropped!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            .logo { font-size: 24px; font-weight: bold; color: #06b6d4; margin-bottom: 24px; }
            .title { color: #ffffff; font-size: 20px; margin-bottom: 16px; }
            .discount { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; padding: 8px 16px; border-radius: 8px; display: inline-block; font-weight: bold; margin-bottom: 16px; }
            .product-name { color: #e2e8f0; font-size: 16px; margin-bottom: 8px; }
            .price-row { display: flex; gap: 16px; margin: 16px 0; }
            .old-price { color: #94a3b8; text-decoration: line-through; }
            .new-price { color: #10b981; font-size: 24px; font-weight: bold; }
            .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 24px; }
            .footer { color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">WEEZLY</div>
            <div class="title">Great news! Price dropped!</div>
            <div class="discount">-${data.discount}%</div>
            <div class="product-name">${data.productName}</div>
            <div class="price-row">
              <span class="old-price">${data.oldPrice}</span>
              <span class="new-price">${data.newPrice}</span>
            </div>
            <p style="color: #94a3b8;">You were tracking this product, and its price has now reached your target level!</p>
            <a href="${data.productUrl}" class="btn">Buy Now</a>
            <div class="footer">
              <p>WEEZLY Platform © 2024</p>
              <p>You received this email because you subscribed to price drop notifications.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  },
  orderConfirmation: {
    ru: (data: { orderId: string; items: { name: string; qty: number; price: string; warranty?: string }[]; total: string; address: string }) => ({
      subject: `WEEZLY: Заказ ${data.orderId} подтверждён`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            .logo { font-size: 24px; font-weight: bold; color: #06b6d4; margin-bottom: 24px; }
            .title { color: #10b981; font-size: 20px; margin-bottom: 8px; }
            .order-id { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
            .item { background: #1e293b; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
            .item-name { color: #e2e8f0; font-size: 14px; }
            .item-details { color: #94a3b8; font-size: 12px; margin-top: 4px; }
            .total { color: #06b6d4; font-size: 24px; font-weight: bold; margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; }
            .address { color: #94a3b8; font-size: 13px; margin-top: 24px; padding: 12px; background: #1e293b; border-radius: 8px; }
            .footer { color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">WEEZLY</div>
            <div class="title">Заказ успешно оформлен!</div>
            <div class="order-id">Номер заказа: ${data.orderId}</div>
            ${data.items.map(i => `
              <div class="item">
                <div class="item-name">${i.name}</div>
                <div class="item-details">${i.qty} × ${i.price}${i.warranty ? ` (+ ${i.warranty})` : ''}</div>
              </div>
            `).join('')}
            <div class="total">Итого: ${data.total}</div>
            <div class="address">
              <strong>Адрес доставки:</strong><br>${data.address}
            </div>
            <div class="footer">
              <p>WEEZLY Platform © 2024</p>
              <p>Спасибо за покупку!</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
    be: (data: { orderId: string; items: { name: string; qty: number; price: string; warranty?: string }[]; total: string; address: string }) => ({
      subject: `WEEZLY: Замова ${data.orderId} пацверджана`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            .logo { font-size: 24px; font-weight: bold; color: #06b6d4; margin-bottom: 24px; }
            .title { color: #10b981; font-size: 20px; margin-bottom: 8px; }
            .order-id { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
            .item { background: #1e293b; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
            .item-name { color: #e2e8f0; font-size: 14px; }
            .item-details { color: #94a3b8; font-size: 12px; margin-top: 4px; }
            .total { color: #06b6d4; font-size: 24px; font-weight: bold; margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; }
            .address { color: #94a3b8; font-size: 13px; margin-top: 24px; padding: 12px; background: #1e293b; border-radius: 8px; }
            .footer { color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">WEEZLY</div>
            <div class="title">Замова паспяхова аформлена!</div>
            <div class="order-id">Нумар замовы: ${data.orderId}</div>
            ${data.items.map(i => `
              <div class="item">
                <div class="item-name">${i.name}</div>
                <div class="item-details">${i.qty} × ${i.price}${i.warranty ? ` (+ ${i.warranty})` : ''}</div>
              </div>
            `).join('')}
            <div class="total">Разам: ${data.total}</div>
            <div class="address">
              <strong>Адрас дастаўкі:</strong><br>${data.address}
            </div>
            <div class="footer">
              <p>WEEZLY Platform © 2024</p>
              <p>Дзякуй за пакупку!</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
    en: (data: { orderId: string; items: { name: string; qty: number; price: string; warranty?: string }[]; total: string; address: string }) => ({
      subject: `WEEZLY: Order ${data.orderId} Confirmed`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            .logo { font-size: 24px; font-weight: bold; color: #06b6d4; margin-bottom: 24px; }
            .title { color: #10b981; font-size: 20px; margin-bottom: 8px; }
            .order-id { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
            .item { background: #1e293b; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
            .item-name { color: #e2e8f0; font-size: 14px; }
            .item-details { color: #94a3b8; font-size: 12px; margin-top: 4px; }
            .total { color: #06b6d4; font-size: 24px; font-weight: bold; margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; }
            .address { color: #94a3b8; font-size: 13px; margin-top: 24px; padding: 12px; background: #1e293b; border-radius: 8px; }
            .footer { color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">WEEZLY</div>
            <div class="title">Order Successfully Placed!</div>
            <div class="order-id">Order ID: ${data.orderId}</div>
            ${data.items.map(i => `
              <div class="item">
                <div class="item-name">${i.name}</div>
                <div class="item-details">${i.qty} × ${i.price}${i.warranty ? ` (+ ${i.warranty})` : ''}</div>
              </div>
            `).join('')}
            <div class="total">Total: ${data.total}</div>
            <div class="address">
              <strong>Shipping Address:</strong><br>${data.address}
            </div>
            <div class="footer">
              <p>WEEZLY Platform © 2024</p>
              <p>Thank you for your purchase!</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  },
  passwordReset: {
    ru: (data: { code: string; email: string }) => ({
      subject: 'WEEZLY: Код восстановления пароля',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            .logo { font-size: 24px; font-weight: bold; color: #06b6d4; margin-bottom: 24px; }
            .title { color: #ffffff; font-size: 20px; margin-bottom: 16px; }
            .code { background: #06b6d4; color: white; font-size: 32px; font-weight: bold; padding: 16px 32px; border-radius: 12px; letter-spacing: 8px; }
            .footer { color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">WEEZLY</div>
            <div class="title">Ваш код восстановления пароля</div>
            <p style="color: #94a3b8;">Введите этот код в форме восстановления:</p>
            <div class="code">${data.code}</div>
            <p style="color: #94a3b8; margin-top: 16px;">Код действителен в течение 10 минут.</p>
            <div class="footer">
              <p>WEEZLY Platform © 2024</p>
              <p>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
    be: (data: { code: string; email: string }) => ({
      subject: 'WEEZLY: Код аднаўлення пароля',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            .logo { font-size: 24px; font-weight: bold; color: #06b6d4; margin-bottom: 24px; }
            .title { color: #ffffff; font-size: 20px; margin-bottom: 16px; }
            .code { background: #06b6d4; color: white; font-size: 32px; font-weight: bold; padding: 16px 32px; border-radius: 12px; letter-spacing: 8px; }
            .footer { color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">WEEZLY</div>
            <div class="title">Ваш код аднаўлення пароля</div>
            <p style="color: #94a3b8;">Увядзіце гэты код у форме аднаўлення:</p>
            <div class="code">${data.code}</div>
            <p style="color: #94a3b8; margin-top: 16px;">Код дзейнічае на працягу 10 хвілін.</p>
            <div class="footer">
              <p>WEEZLY Platform © 2024</p>
              <p>Калі вы не запытвалі аднаўленне пароля, праігнаруйце гэты ліст.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
    en: (data: { code: string; email: string }) => ({
      subject: 'WEEZLY: Password Reset Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            .logo { font-size: 24px; font-weight: bold; color: #06b6d4; margin-bottom: 24px; }
            .title { color: #ffffff; font-size: 20px; margin-bottom: 16px; }
            .code { background: #06b6d4; color: white; font-size: 32px; font-weight: bold; padding: 16px 32px; border-radius: 12px; letter-spacing: 8px; }
            .footer { color: #64748b; font-size: 12px; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">WEEZLY</div>
            <div class="title">Your Password Reset Code</div>
            <p style="color: #94a3b8;">Enter this code in the password reset form:</p>
            <div class="code">${data.code}</div>
            <p style="color: #94a3b8; margin-top: 16px;">This code is valid for 10 minutes.</p>
            <div class="footer">
              <p>WEEZLY Platform © 2024</p>
              <p>If you didn't request a password reset, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  },
};

// Types
interface SendEmailRequest {
  to: string;
  type: 'priceDrop' | 'orderConfirmation' | 'passwordReset';
  language: 'ru' | 'be' | 'en';
  data: Record<string, any>;
}

// API Routes

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Send email notification
app.post('/api/notifications/send', async (req: Request, res: Response) => {
  const { to, type, language, data }: SendEmailRequest = req.body;

  if (!to || !type || !language) {
    return res.status(400).json({ error: 'Missing required fields: to, type, language' });
  }

  // Check if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP not configured, simulating email send');
    return res.json({
      success: true,
      message: 'Email would be sent (SMTP not configured)',
      to,
      type,
    });
  }

  try {
    const transporter = createTransporter();
    const template = emailTemplates[type]?.[language];

    if (!template) {
      return res.status(400).json({ error: 'Invalid email type or language' });
    }

    const emailContent = template(data as any);

    const mailOptions = {
      from: process.env.SMTP_FROM || 'WEEZLY Platform <noreply@weezly.com>',
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    res.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Password reset request
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  const { email, language = 'ru' } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Check if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('SMTP not configured, simulating password reset');
    return res.json({
      success: true,
      code,
      message: 'Password reset code generated (SMTP not configured)',
    });
  }

  try {
    const transporter = createTransporter();
    const template = emailTemplates.passwordReset[language as keyof typeof emailTemplates.passwordReset] || emailTemplates.passwordReset.en;
    const emailContent = template({ code, email });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'WEEZLY Platform <noreply@weezly.com>',
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    res.json({ success: true, code });
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ error: 'Failed to send password reset email', details: error.message });
  }
});

// bePaid payment integration
app.post('/api/payments/checkout', async (req: Request, res: Response) => {
  const { amount, currency, orderId, customerEmail, description } = req.body;

  const storeId = process.env.BEPAID_STORE_ID;
  const secretKey = process.env.BEPAID_SECRET_KEY;

  if (!storeId || !secretKey) {
    // Return demo response if bePaid not configured
    return res.json({
      success: true,
      checkoutUrl: null,
      token: `demo-token-${Date.now()}`,
      message: 'bePayd not configured, using demo mode',
    });
  }

  // Currency code mapping
  const currencyCode = currency === 'BYN' ? 933 : 840;

  try {
    // Generate Base64 auth header
    const auth = Buffer.from(`${storeId}:${secretKey}`).toString('base64');

    const checkoutData = {
      checkout: {
        version: 2,
        test: true, // Always test mode for this integration
        amount: Math.round(amount * 100), // Convert to cents
        currency: currencyCode,
        description: description || `WEEZLY Order ${orderId}`,
        order_id: orderId,
        customer: {
          email: customerEmail,
        },
        settings: {
          language: req.body.language === 'be' ? 'ru' : req.body.language || 'ru',
          success_url: `${process.env.FRONTEND_URL}/payment/success`,
          decline_url: `${process.env.FRONTEND_URL}/payment/decline`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        },
        payment_method: {
          types: ['card'],
        },
      },
    };

    const response = await fetch(process.env.BEPAID_API_URL || 'https://checkout.bepaid.by/ctp/api/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    });

    const result = await response.json();

    if (response.ok && result.checkout) {
      res.json({
        success: true,
        checkoutUrl: result.checkout.checkout_url,
        token: result.checkout.token,
        orderId: result.checkout.order_id,
      });
    } else {
      console.error('bePaid error:', result);
      res.status(400).json({ error: 'Failed to create payment checkout', details: result });
    }
  } catch (error: any) {
    console.error('Error creating bePaid checkout:', error);
    res.status(500).json({ error: 'Failed to create payment checkout', details: error.message });
  }
});

// Verify bePaid payment status
app.get('/api/payments/status/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const storeId = process.env.BEPAID_STORE_ID;
  const secretKey = process.env.BEPAID_SECRET_KEY;

  if (!storeId || !secretKey) {
    // Return demo success if bePaid not configured
    return res.json({ success: true, status: 'successful', orderId });
  }

  try {
    const auth = Buffer.from(`${storeId}:${secretKey}`).toString('base64');

    // Query bePaid for payment status
    const response = await fetch(`https://checkout.bepaid.by/ctp/api/checkouts/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok && result.checkout) {
      res.json({
        success: true,
        status: result.checkout.status,
        orderId: result.checkout.order_id,
        payment: result.checkout.payment,
      });
    } else {
      res.status(400).json({ error: 'Failed to get payment status', details: result });
    }
  } catch (error: any) {
    console.error('Error getting bePaid status:', error);
    res.status(500).json({ error: 'Failed to get payment status', details: error.message });
  }
});

// bePaid webhook handler
app.post('/api/payments/webhook', (req: Request, res: Response) => {
  console.log('bePaid webhook received:', req.body);

  // Verify webhook signature (implement signature verification for production)
  const { checkout } = req.body;

  if (checkout && checkout.status === 'successful') {
    // Process successful payment
    console.log(`Payment successful for order: ${checkout.order_id}`);
  }

  res.status(200).send('OK');
});

// Start server
app.listen(PORT, () => {
  console.log(`WEEZLY Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
