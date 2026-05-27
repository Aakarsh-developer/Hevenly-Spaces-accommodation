import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { renderBrandedEmail, renderPlainTextEmail } from '../_shared/emailTemplates.ts';
import { sendEmailWithSendGrid } from '../_shared/sendgrid.ts';

interface NewUserPayload {
  userName: string;
  userEmail: string;
  role: string;
  registrationDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const adminEmail = Deno.env.get('ADMIN_ALERT_EMAIL');
    if (!adminEmail) {
      throw new Error('Missing required environment variable: ADMIN_ALERT_EMAIL');
    }

    const payload = await req.json() as NewUserPayload;
    console.info('[email] Admin registration alert requested', payload);
    if (!payload.userEmail || !payload.userName || !payload.registrationDate) {
      return new Response(JSON.stringify({ success: false, error: 'userName, userEmail, and registrationDate are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const template = {
      preheader: `A new ${payload.role} account just joined Havenly Spaces.`,
      eyebrow: 'Admin Alert',
      headline: 'New account registration',
      intro: 'A new user has created an account on Havenly Spaces. You can review their role and activity from the admin workspace if needed.',
      sections: [
        { title: 'Name', body: payload.userName },
        { title: 'Email', body: payload.userEmail },
        { title: 'Role', body: payload.role },
        { title: 'Registered At', body: new Date(payload.registrationDate).toLocaleString() },
      ],
      footerTitle: 'Operations note',
      footerText: 'This alert is informational and does not require manual action unless you are monitoring unusual registration activity.',
    };

    await sendEmailWithSendGrid({
      to: adminEmail,
      subject: `New user registered: ${payload.userName}`,
      html: renderBrandedEmail(template),
      text: renderPlainTextEmail(template),
    });
    console.info('[email] Admin registration alert sent', { to: adminEmail, userEmail: payload.userEmail });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[email] Admin registration alert failed', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
