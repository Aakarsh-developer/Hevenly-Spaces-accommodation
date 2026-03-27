import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
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

    await sendEmailWithSendGrid({
      to: adminEmail,
      subject: `New user registered: ${payload.userName}`,
      html: `
        <h2>New User Registration</h2>
        <p>A new user has registered on Havenly Spaces.</p>
        <ul>
          <li><strong>Name:</strong> ${payload.userName}</li>
          <li><strong>Email:</strong> ${payload.userEmail}</li>
          <li><strong>Role:</strong> ${payload.role}</li>
          <li><strong>Registered At:</strong> ${new Date(payload.registrationDate).toLocaleString()}</li>
        </ul>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
