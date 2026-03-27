import { supabase } from '@/integrations/supabase/client';

export interface PaymentGatewayRequest {
  amount: number;
  bookingId: string;
  kind: 'initial_booking' | 'monthly_rent';
  metadata?: Record<string, unknown>;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentGatewayResult {
  success: boolean;
  provider: string;
  status: 'paid' | 'failed' | 'pending';
  reference: string;
  processedAt: string;
  metadata: Record<string, unknown>;
}

const PROVIDER = 'razorpay';
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

const loadRazorpayScript = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const processRazorpayPayment = async (request: PaymentGatewayRequest): Promise<PaymentGatewayResult> => {
  if (!RAZORPAY_KEY_ID) {
    return {
      success: false,
      provider: PROVIDER,
      status: 'failed',
      reference: '',
      processedAt: new Date().toISOString(),
      metadata: { reason: 'Missing VITE_RAZORPAY_KEY_ID' },
    };
  }

  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded || !window.Razorpay) {
    return {
      success: false,
      provider: PROVIDER,
      status: 'failed',
      reference: '',
      processedAt: new Date().toISOString(),
      metadata: { reason: 'Razorpay SDK failed to load' },
    };
  }

  const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
    body: {
      amount: request.amount,
      bookingId: request.bookingId,
      kind: request.kind,
      metadata: request.metadata || {},
    },
  });

  if (orderError || !orderData?.success) {
    return {
      success: false,
      provider: PROVIDER,
      status: 'failed',
      reference: '',
      processedAt: new Date().toISOString(),
      metadata: { reason: orderError?.message || orderData?.error || 'Order creation failed' },
    };
  }

  return new Promise((resolve) => {
    const razorpay = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: 'Havenly Spaces',
      description: request.kind === 'initial_booking' ? 'Room booking payment' : 'Monthly rent payment',
      order_id: orderData.order.id,
      theme: { color: '#1f6f4a' },
      prefill: {
        name: request.customerName,
        email: request.customerEmail,
        contact: request.customerPhone,
      },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
          body: {
            bookingId: request.bookingId,
            kind: request.kind,
            metadata: request.metadata || {},
            ...response,
          },
        });

        if (verifyError || !verifyData?.success) {
          resolve({
            success: false,
            provider: PROVIDER,
            status: 'failed',
            reference: response.razorpay_payment_id,
            processedAt: new Date().toISOString(),
            metadata: { reason: verifyError?.message || verifyData?.error || 'Verification failed' },
          });
          return;
        }

        resolve({
          success: true,
          provider: PROVIDER,
          status: 'paid',
          reference: response.razorpay_payment_id,
          processedAt: verifyData.verifiedAt,
          metadata: {
            order_id: response.razorpay_order_id,
            signature_verified: true,
            ...request.metadata,
          },
        });
      },
      modal: {
        ondismiss: () => {
          resolve({
            success: false,
            provider: PROVIDER,
            status: 'pending',
            reference: orderData.order.id,
            processedAt: new Date().toISOString(),
            metadata: { reason: 'Checkout dismissed by user' },
          });
        },
      },
    });

    razorpay.open();
  });
};

export const paymentGatewayConfig = {
  activeProvider: PROVIDER,
  supportedProviders: ['razorpay', 'stripe'],
};
