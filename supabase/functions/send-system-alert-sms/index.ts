import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { sendSmsWithTwilio } from '../_shared/twilio.ts';

interface SystemAlertSmsPayload {
  channel?: 'email' | 'sms';
  recipientName?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as SystemAlertSmsPayload;

    if (!payload.recipientPhone || !payload.title || !payload.message) {
      return new Response(JSON.stringify({
        success: false,
        error: 'recipientPhone, title, and message are required.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.info('[sms] System alert SMS requested', {
      recipientPhone: payload.recipientPhone,
      title: payload.title,
      metadata: payload.metadata,
    });

    const smsBody = `${payload.title}\n${payload.message}`.trim();
    const result = await sendSmsWithTwilio({
      to: payload.recipientPhone,
      body: smsBody,
    });

    return new Response(JSON.stringify({
      success: true,
      skipped: result.skipped ?? false,
      provider: result.provider,
      sid: result.sid,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[sms] System alert SMS failed', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
