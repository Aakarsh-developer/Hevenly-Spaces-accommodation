/// <reference types="vite/client" />

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  theme?: { color?: string };
  retry?: {
    enabled?: boolean;
    max_count?: number;
  };
  config?: {
    display?: {
      language?: string;
      blocks?: Record<string, {
        name?: string;
        instruments?: Array<{
          method: 'upi' | 'card' | 'netbanking' | 'wallet';
          flows?: Array<'collect' | 'intent'>;
        }>;
      }>;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
  notes?: Record<string, string>;
  method?: {
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
  };
  remember_customer?: boolean;
  send_sms_hash?: boolean;
  allow_rotation?: boolean;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface Window {
  Razorpay?: new (options: RazorpayCheckoutOptions) => {
    open: () => void;
    on: (
      event: 'payment.failed',
      handler: (response: {
        error?: {
          description?: string;
          reason?: string;
          source?: string;
          step?: string;
        };
      }) => void,
    ) => void;
  };
}
