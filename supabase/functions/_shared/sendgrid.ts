interface SendGridEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const SENDGRID_TIMEOUT_MS = 15000;

const getRequiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const sendEmailWithSendGrid = async ({ to, subject, html, text }: SendGridEmailPayload) => {
  const apiKey = getRequiredEnv('SENDGRID_API_KEY');
  const from = getRequiredEnv('SENDGRID_FROM_EMAIL');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from)) {
    throw new Error('SENDGRID_FROM_EMAIL is not a valid sender email address.');
  }

  console.info('[email] Sending via SendGrid', {
    to,
    subject,
    hasText: !!text,
    fromName: 'Havenly Spaces',
    fromEmail: from,
  });

  let lastError = '';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SENDGRID_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from, name: 'Havenly Spaces' },
          subject,
          content: [
            ...(text ? [{ type: 'text/plain', value: text }] : []),
            { type: 'text/html', value: html },
          ],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'SendGrid request timed out or failed.';
      console.error('[email] SendGrid request threw', {
        to,
        subject,
        attempt,
        error,
      });

      if (attempt === 3) break;
      await sleep(attempt * 500);
      continue;
    } finally {
      clearTimeout(timeout);
    }

    if (response.ok) {
      console.info('[email] SendGrid accepted request', {
        to,
        subject,
        status: response.status,
        attempt,
        messageId: response.headers.get('x-message-id'),
      });
      return;
    }

    const message = await response.text();
    lastError = `SendGrid request failed: ${response.status} ${message}`;
    console.error('[email] SendGrid request failed', {
      to,
      subject,
      attempt,
      status: response.status,
      message,
    });

    if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === 3) {
      break;
    }

    await sleep(attempt * 500);
  }

  throw new Error(lastError || 'SendGrid request failed for an unknown reason.');
};
