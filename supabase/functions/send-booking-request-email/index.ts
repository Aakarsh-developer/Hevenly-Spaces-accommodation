import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { renderBrandedEmail, renderPlainTextEmail } from '../_shared/emailTemplates.ts';
import { sendEmailWithSendGrid } from '../_shared/sendgrid.ts';

interface BookingRequestPayload {
  ownerEmail: string;
  ownerName: string;
  requesterName: string;
  requesterEmail: string;
  studentEmail?: string;
  roomTitle: string;
  roomLocation: string;
  rentAmount?: number;
  bookingDate: string;
  dashboardUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as BookingRequestPayload;
    console.info('[email] Booking request notification requested', payload);
    if (!payload.ownerEmail || !payload.ownerName || !payload.requesterName || !payload.requesterEmail || !payload.roomTitle || !payload.roomLocation || !payload.bookingDate) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ownerEmail, ownerName, requesterName, requesterEmail, roomTitle, roomLocation, and bookingDate are required.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const ownerTemplate = {
      preheader: `A new booking request has arrived for ${payload.roomTitle}.`,
      eyebrow: 'Booking Request',
      headline: 'A student wants to book your room',
      intro: `Hello ${payload.ownerName}, you have received a new booking request on Havenly Spaces. Review the details below and open your dashboard when you are ready to respond.`,
      sections: [
        { title: 'Student', body: payload.requesterName },
        { title: 'Student Email', body: payload.requesterEmail },
        { title: 'Room', body: payload.roomTitle },
        { title: 'Location', body: payload.roomLocation },
        { title: 'Monthly Rent', body: payload.rentAmount ? `Rs${payload.rentAmount.toLocaleString()}` : 'Listed in dashboard' },
        { title: 'Booking Date', body: new Date(payload.bookingDate).toLocaleString() },
      ],
      ctaLabel: 'Review Booking',
      ctaUrl: payload.dashboardUrl,
      footerTitle: 'Next step',
      footerText: 'Open your dashboard to accept, reject, or follow the request through the full payment and agreement workflow.',
    };

    await sendEmailWithSendGrid({
      to: payload.ownerEmail,
      subject: `New booking request for ${payload.roomTitle}`,
      html: renderBrandedEmail(ownerTemplate),
      text: renderPlainTextEmail(ownerTemplate),
    });
    console.info('[email] Booking request owner email sent', {
      ownerEmail: payload.ownerEmail,
      roomTitle: payload.roomTitle,
    });

    if (payload.studentEmail) {
      const studentTemplate = {
        preheader: `Your booking request for ${payload.roomTitle} has been sent.`,
        eyebrow: 'Booking Submitted',
        headline: 'Your booking request is on its way',
        intro: `Hi ${payload.requesterName}, your request for ${payload.roomTitle} has been submitted successfully. The owner will review it before payment and agreement steps open up.`,
        sections: [
          { title: 'Room', body: payload.roomTitle },
          { title: 'Location', body: payload.roomLocation },
          { title: 'Monthly Rent', body: payload.rentAmount ? `Rs${payload.rentAmount.toLocaleString()}` : 'Check room details' },
          { title: 'Submitted At', body: new Date(payload.bookingDate).toLocaleString() },
        ],
        ctaLabel: 'Open Dashboard',
        ctaUrl: payload.dashboardUrl,
        footerTitle: 'What happens next?',
        footerText: 'You will receive in-app updates when the owner accepts or rejects the request. Once accepted, payment and chat will unlock automatically.',
      };

      await sendEmailWithSendGrid({
        to: payload.studentEmail,
        subject: `Booking request received for ${payload.roomTitle}`,
        html: renderBrandedEmail(studentTemplate),
        text: renderPlainTextEmail(studentTemplate),
      });
      console.info('[email] Booking request student confirmation sent', {
        studentEmail: payload.studentEmail,
        roomTitle: payload.roomTitle,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[email] Booking request email failed', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
