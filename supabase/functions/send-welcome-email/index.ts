import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { renderBrandedEmail, renderPlainTextEmail } from '../_shared/emailTemplates.ts';
import { sendEmailWithSendGrid } from '../_shared/sendgrid.ts';

interface WelcomePayload {
  userName: string;
  userEmail: string;
  role: 'student' | 'owner';
  appUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as WelcomePayload;
    console.info('[email] Welcome email requested', payload);
    if (!payload.userEmail || !payload.role) {
      return new Response(JSON.stringify({ success: false, error: 'userEmail and role are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const template = {
      preheader: 'Welcome to Havenly Spaces.',
      eyebrow: 'Welcome',
      headline: `Welcome to Havenly Spaces${payload.userName ? `, ${payload.userName}` : ''}`,
      intro: payload.role === 'owner'
        ? 'Your owner account is ready. You can start adding rooms, reviewing booking requests, and managing monthly rent flows from one organized dashboard.'
        : 'Your student account is ready. You can start exploring approved rooms, saving favorites, and moving through booking, payment, and agreement steps inside one workspace.',
      sections: [
        {
          title: 'What makes the platform safer?',
          body: 'Bookings, payments, chat, and reports stay inside the platform so important actions are easier to track and support.',
        },
        {
          title: payload.role === 'owner' ? 'Owner tip' : 'Student tip',
          body: payload.role === 'owner'
            ? 'Complete your profile, upload clear room photos, and include accurate pricing and facilities to improve trust and booking quality.'
            : 'Use wishlist and room details to compare price, facilities, and map location before sending a booking request.',
        },
      ],
      ctaLabel: 'Open Havenly Spaces',
      ctaUrl: payload.appUrl,
      footerTitle: 'Need support?',
      footerText: 'If anything feels unclear, you can return to the app and continue from your dashboard at any time.',
    };

    await sendEmailWithSendGrid({
      to: payload.userEmail,
      subject: 'Welcome to Havenly Spaces',
      html: renderBrandedEmail(template),
      text: renderPlainTextEmail(template),
    });
    console.info('[email] Welcome email sent', { to: payload.userEmail, role: payload.role });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[email] Welcome email failed', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
