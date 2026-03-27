import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { sendEmailWithSendGrid } from '../_shared/sendgrid.ts';

interface BookingRequestPayload {
  ownerEmail: string;
  ownerName: string;
  requesterName: string;
  requesterEmail: string;
  roomTitle: string;
  roomLocation: string;
  bookingDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as BookingRequestPayload;

    await sendEmailWithSendGrid({
      to: payload.ownerEmail,
      subject: `New booking request for ${payload.roomTitle}`,
      html: `
        <h2>New Booking Request</h2>
        <p>Hello ${payload.ownerName},</p>
        <p>You have received a new booking request on Havenly Spaces.</p>
        <ul>
          <li><strong>Student:</strong> ${payload.requesterName}</li>
          <li><strong>Email:</strong> ${payload.requesterEmail}</li>
          <li><strong>Room:</strong> ${payload.roomTitle}</li>
          <li><strong>Location:</strong> ${payload.roomLocation}</li>
          <li><strong>Booking Date:</strong> ${new Date(payload.bookingDate).toLocaleString()}</li>
        </ul>
        <p>Please log in to your dashboard to review the request.</p>
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
