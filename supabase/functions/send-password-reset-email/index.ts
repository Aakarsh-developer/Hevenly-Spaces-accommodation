import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { corsHeaders } from '../_shared/cors.ts';
import { renderBrandedEmail, renderPlainTextEmail } from '../_shared/emailTemplates.ts';
import { sendEmailWithSendGrid } from '../_shared/sendgrid.ts';

interface PasswordResetPayload {
  email: string;
  redirectTo?: string;
}

const COOLDOWN_SECONDS = 60;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const payload = await req.json() as PasswordResetPayload;
    const rawEmail = payload.email?.trim();
    if (!rawEmail) {
      return new Response(JSON.stringify({
        success: false,
        error: 'email is required.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const normalizedEmail = rawEmail.toLowerCase();
    const redirectTo = payload.redirectTo?.trim();

    console.info('[auth-recovery] Password reset requested', {
      email: normalizedEmail,
      redirectTo,
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const cooldownThreshold = new Date(Date.now() - COOLDOWN_SECONDS * 1000).toISOString();
    const { data: recentRequest } = await adminClient
      .from('password_reset_requests')
      .select('id, requested_at')
      .eq('email', normalizedEmail)
      .gte('requested_at', cooldownThreshold)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentRequest) {
      return new Response(JSON.stringify({
        success: true,
        throttled: true,
        cooldownSeconds: COOLDOWN_SECONDS,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: redirectTo ? { redirectTo } : undefined,
    });
    console.info('[auth-recovery] Recovery link generation result', {
      email: normalizedEmail,
      hasActionLink: !!data?.properties?.action_link,
      hasHashedToken: !!data?.properties?.hashed_token,
      hasOtp: !!data?.properties?.email_otp,
      error: error?.message,
    });

    await adminClient.from('password_reset_requests').insert({
      email: normalizedEmail,
      channel: 'email',
      requested_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status: error ? 'suppressed' : 'sent',
    });

    if (error || !data?.properties?.action_link) {
      console.warn('[auth-recovery] Password reset link generation suppressed', {
        email: normalizedEmail,
        error: error?.message,
      });
      return new Response(JSON.stringify({
        success: true,
        cooldownSeconds: COOLDOWN_SECONDS,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const recoveryUrl = redirectTo && data.properties.hashed_token
      ? `${redirectTo}${redirectTo.includes('?') ? '&' : '?'}token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery`
      : data.properties.action_link;

    const template = {
      preheader: 'Your password reset instructions are ready.',
      eyebrow: 'Account Recovery',
      headline: 'Reset your Havenly Spaces password',
      intro: 'We received a request to reset your password. Use the secure button below or the one-time code in this email to continue.',
      sections: [
        {
          title: 'One-time code',
          body: data.properties.email_otp || 'Use the secure reset button below if your email client supports it.',
        },
        {
          title: 'Security note',
          body: 'If you did not request this reset, you can ignore this email safely. Your current password will remain unchanged.',
        },
      ],
      ctaLabel: 'Reset Password',
      ctaUrl: recoveryUrl,
      footerTitle: 'Token validity',
      footerText: 'For your security, recovery links and codes expire automatically. If this one stops working, request a fresh reset from the sign-in page.',
    };

    await sendEmailWithSendGrid({
      to: normalizedEmail,
      subject: 'Reset your Havenly Spaces password',
      html: renderBrandedEmail(template),
      text: renderPlainTextEmail(template),
    });
    console.info('[auth-recovery] Password reset email sent', {
      email: normalizedEmail,
      hasRecoveryUrl: !!recoveryUrl,
    });

    return new Response(JSON.stringify({
      success: true,
      cooldownSeconds: COOLDOWN_SECONDS,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[auth-recovery] Password reset email failed', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
