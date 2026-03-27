interface SendGridEmailPayload {
  to: string;
  subject: string;
  html: string;
}

const getRequiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const sendEmailWithSendGrid = async ({ to, subject, html }: SendGridEmailPayload) => {
  const apiKey = getRequiredEnv('SENDGRID_API_KEY');
  const from = getRequiredEnv('SENDGRID_FROM_EMAIL');

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: 'Havenly Spaces' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`SendGrid request failed: ${response.status} ${message}`);
  }
};
