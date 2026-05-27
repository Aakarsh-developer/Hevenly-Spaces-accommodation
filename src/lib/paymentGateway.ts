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
  error?: string;
}

const PROVIDER = 'razorpay';
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
let razorpayScriptPromise: Promise<boolean> | null = null;
const inFlightPayments = new Set<string>();

const loadRazorpayScript = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if (window.Razorpay) return true;
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      console.info('[payment] Razorpay SDK loaded');
      resolve(true);
    };
    script.onerror = () => {
      console.error('[payment] Razorpay SDK failed to load');
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};

export const processRazorpayPayment = async (request: PaymentGatewayRequest): Promise<PaymentGatewayResult> => {
  const paymentKey = `${request.kind}:${request.bookingId}:${String(request.metadata?.payment_request_id || 'initial')}`;
  if (inFlightPayments.has(paymentKey)) {
    console.warn('[payment] Duplicate payment submission blocked', { paymentKey });
    return {
      success: false,
      provider: PROVIDER,
      status: 'pending',
      reference: '',
      processedAt: new Date().toISOString(),
      metadata: { reason: 'Duplicate payment submission blocked' },
      error: 'A payment attempt is already in progress. Please wait.',
    };
  }

  console.info('[payment] Starting Razorpay flow', {
    paymentKey,
    bookingId: request.bookingId,
    kind: request.kind,
    hasRazorpayKey: !!RAZORPAY_KEY_ID,
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseAnonKey: !!(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY),
  });

  if (!RAZORPAY_KEY_ID) {
    return {
      success: false,
      provider: PROVIDER,
      status: 'failed',
      reference: '',
      processedAt: new Date().toISOString(),
      metadata: { reason: 'Missing VITE_RAZORPAY_KEY_ID' },
      error: 'Missing VITE_RAZORPAY_KEY_ID environment variable.',
    };
  }

  inFlightPayments.add(paymentKey);

  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded || !window.Razorpay) {
    inFlightPayments.delete(paymentKey);
    return {
      success: false,
      provider: PROVIDER,
      status: 'failed',
      reference: '',
      processedAt: new Date().toISOString(),
      metadata: { reason: 'Razorpay SDK failed to load' },
      error: 'Razorpay checkout could not be loaded. Check your internet connection and try again.',
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

  console.info('[payment] Razorpay order response', { orderData, orderError, paymentKey });

  if (orderError || !orderData?.success || !orderData?.order?.id) {
    console.error('[payment] Razorpay order creation failed', {
      orderError,
      orderData,
      bookingId: request.bookingId,
      kind: request.kind,
    });
    inFlightPayments.delete(paymentKey);
    return {
      success: false,
      provider: PROVIDER,
      status: 'failed',
      reference: '',
      processedAt: new Date().toISOString(),
      metadata: { reason: orderError?.message || orderData?.error || 'Order creation failed' },
      error: orderError?.message || orderData?.error || 'Order creation failed',
    };
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: PaymentGatewayResult) => {
      if (settled) return;
      settled = true;
      inFlightPayments.delete(paymentKey);
      resolve(result);
    };

    try {
      const razorpay = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Havenly Spaces',
        description: request.kind === 'initial_booking' ? 'Room booking payment' : 'Monthly rent payment',
        order_id: orderData.order.id,
        theme: { color: '#1f6f4a' },
        retry: {
          enabled: true,
          max_count: 1,
        },
        config: {
          display: {
            language: 'en',
            blocks: {
              upi: {
                name: 'UPI Apps (PhonePe, Google Pay, Paytm)',
                instruments: [{ method: 'upi', flows: ['intent', 'collect'] }],
              },
              cards: {
                name: 'Cards',
                instruments: [{ method: 'card' }],
              },
              netbanking: {
                name: 'Netbanking',
                instruments: [{ method: 'netbanking' }],
              },
              wallets: {
                name: 'Wallets',
                instruments: [{ method: 'wallet' }],
              },
            },
            sequence: ['block.upi', 'block.cards', 'block.netbanking', 'block.wallets'],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        notes: Object.fromEntries(
          Object.entries(request.metadata || {}).map(([key, value]) => [
            key,
            typeof value === 'string' ? value : JSON.stringify(value),
          ]),
        ),
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        remember_customer: false,
        send_sms_hash: true,
        allow_rotation: true,
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
          console.info('[payment] Razorpay payment captured, verifying', response);
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              bookingId: request.bookingId,
              kind: request.kind,
              metadata: request.metadata || {},
              ...response,
            },
          });

          console.info('[payment] Razorpay verification response', {
            verifyData,
            verifyError,
            paymentKey,
          });

          if (verifyError || !verifyData?.success) {
            console.error('[payment] Razorpay verification failed', { verifyError, verifyData, response });
            finish({
              success: false,
              provider: PROVIDER,
              status: 'failed',
              reference: response.razorpay_payment_id,
              processedAt: new Date().toISOString(),
              metadata: { reason: verifyError?.message || verifyData?.error || 'Verification failed' },
              error: verifyError?.message || verifyData?.error || 'Payment verification failed',
            });
            return;
          }

          finish({
            success: true,
            provider: PROVIDER,
            status: 'paid',
            reference: response.razorpay_payment_id,
            processedAt: verifyData.verifiedAt || new Date().toISOString(),
            metadata: {
              order_id: verifyData.orderId || response.razorpay_order_id,
              payment_id: verifyData.paymentId || response.razorpay_payment_id,
              payment_signature: verifyData.signature || response.razorpay_signature,
              signature_verified: true,
              verified_at: verifyData.verifiedAt || new Date().toISOString(),
              payer_name: request.customerName,
              payer_email: request.customerEmail,
              payer_phone: request.customerPhone,
              ...request.metadata,
            },
          });
        },
        modal: {
          ondismiss: () => {
            console.warn('[payment] Razorpay checkout dismissed', { paymentKey, orderId: orderData.order.id });
            finish({
              success: false,
              provider: PROVIDER,
              status: 'pending',
              reference: orderData.order.id,
              processedAt: new Date().toISOString(),
              metadata: { reason: 'Checkout dismissed by user' },
              error: 'Payment window was closed before completion.',
            });
          },
        },
      });

      razorpay.on('payment.failed', (response) => {
        console.error('[payment] Razorpay payment.failed event', { paymentKey, response });
        finish({
          success: false,
          provider: PROVIDER,
          status: 'failed',
          reference: orderData.order.id,
          processedAt: new Date().toISOString(),
          metadata: {
            reason: response.error?.description || response.error?.reason || 'Payment failed',
            source: response.error?.source,
            step: response.error?.step,
            ...request.metadata,
          },
          error: response.error?.description || response.error?.reason || 'Payment failed before verification',
        });
      });

      console.info('[payment] Opening Razorpay checkout', {
        paymentKey,
        orderId: orderData.order.id,
        amount: orderData.order.amount,
      });
      razorpay.open();
    } catch (error) {
      console.error('[payment] Razorpay open failed', error);
      finish({
        success: false,
        provider: PROVIDER,
        status: 'failed',
        reference: orderData.order.id,
        processedAt: new Date().toISOString(),
        metadata: { reason: error instanceof Error ? error.message : 'Razorpay open failed' },
        error: error instanceof Error ? error.message : 'Razorpay checkout could not be opened',
      });
    }
  });
};

export const paymentGatewayConfig = {
  activeProvider: PROVIDER,
  supportedProviders: ['razorpay', 'stripe'],
};
