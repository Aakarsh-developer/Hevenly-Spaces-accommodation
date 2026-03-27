import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface VerifyPaymentPayload {
  bookingId: string;
  kind: 'initial_booking' | 'monthly_rent';
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  metadata?: Record<string, unknown>;
}

const hex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!razorpayKeySecret) {
      throw new Error('Missing Razorpay secret');
    }

    const payload = await req.json() as VerifyPaymentPayload;
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(razorpayKeySecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signaturePayload = `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`;
    const generatedSignature = hex(await crypto.subtle.sign('HMAC', secretKey, encoder.encode(signaturePayload)));

    if (generatedSignature !== payload.razorpay_signature) {
      throw new Error('Razorpay signature verification failed');
    }

    return new Response(JSON.stringify({
      success: true,
      bookingId: payload.bookingId,
      kind: payload.kind,
      verifiedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
