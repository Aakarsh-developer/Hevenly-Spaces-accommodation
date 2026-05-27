import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface CreateOrderPayload {
  amount: number;
  bookingId: string;
  kind: 'initial_booking' | 'monthly_rent';
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Missing Razorpay credentials');
    }

    const payload = await req.json() as CreateOrderPayload;
    if (!payload.amount || payload.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const authHeader = `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`;
    const receiptSuffix = String(
      payload.metadata?.payment_request_id ||
      payload.metadata?.due_month ||
      crypto.randomUUID().slice(0, 8),
    ).replace(/[^a-zA-Z0-9_-]/g, '');
    const receipt = `${payload.kind}-${payload.bookingId.slice(0, 12)}-${receiptSuffix}`.slice(0, 40);
    const notes = Object.fromEntries(
      Object.entries({
        booking_id: payload.bookingId,
        payment_kind: payload.kind,
        ...(payload.metadata || {}),
      }).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]),
    );

    console.info('[create-razorpay-order] Creating order', {
      bookingId: payload.bookingId,
      kind: payload.kind,
      amount: payload.amount,
      receipt,
      metadata: notes,
    });

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        ...corsHeaders,
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(payload.amount * 100),
        currency: 'INR',
        receipt,
        notes,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[create-razorpay-order] Razorpay API error', data);
      throw new Error(data?.error?.description || 'Failed to create Razorpay order');
    }

    console.info('[create-razorpay-order] Order created', {
      orderId: data?.id,
      amount: data?.amount,
      receipt: data?.receipt,
    });

    return new Response(JSON.stringify({ success: true, order: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[create-razorpay-order] Failed', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
