const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface EmailNotification {
  to: string;
  type: 'priceDrop' | 'orderConfirmation' | 'passwordReset';
  language: 'ru' | 'be' | 'en';
  data: Record<string, any>;
}

interface PaymentCheckout {
  amount: number;
  currency: 'BYN' | 'USD';
  orderId: string;
  customerEmail: string;
  description?: string;
  language: 'ru' | 'be' | 'en';
}

export async function sendEmail(notification: EmailNotification): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function forgotPassword(email: string, language: 'ru' | 'be' | 'en'): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, language }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function createPaymentCheckout(checkout: PaymentCheckout): Promise<{
  success: boolean;
  checkoutUrl?: string;
  token?: string;
  orderId?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkout),
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating payment checkout:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function getPaymentStatus(orderId: string): Promise<{
  success: boolean;
  status?: string;
  orderId?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/payments/status/${orderId}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting payment status:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}
