import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { renderBrandedEmail, renderPlainTextEmail } from '../_shared/emailTemplates.ts';
import { sendEmailWithSendGrid } from '../_shared/sendgrid.ts';

interface SystemAlertPayload {
  channel?: 'email' | 'sms';
  recipientName?: string;
  recipientEmail?: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

const formatMetadataLines = (metadata?: Record<string, unknown>) => {
  if (!metadata) return [];

  return Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== undefined && `${value}`.trim() !== '')
    .map(([key, value]) => ({
      title: key.replaceAll('_', ' ').replace(/\b\w/g, (match) => match.toUpperCase()),
      body: String(value),
    }));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as SystemAlertPayload;

    if (!payload.recipientEmail || !payload.title || !payload.message) {
      return new Response(JSON.stringify({
        success: false,
        error: 'recipientEmail, title, and message are required.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.info('[email] System alert email requested', {
      recipientEmail: payload.recipientEmail,
      title: payload.title,
      metadata: payload.metadata,
    });

    const template = {
      preheader: payload.title,
      eyebrow: 'Platform Alert',
      headline: payload.title,
      intro: payload.recipientName
        ? `Hello ${payload.recipientName}, ${payload.message}`
        : payload.message,
      sections: formatMetadataLines(payload.metadata),
      footerTitle: 'Next step',
      footerText: 'Sign in to Havenly Spaces to review the latest update and continue from your dashboard.',
    };

    await sendEmailWithSendGrid({
      to: payload.recipientEmail,
      subject: payload.title,
      html: renderBrandedEmail(template),
      text: renderPlainTextEmail(template),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[email] System alert email failed', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
