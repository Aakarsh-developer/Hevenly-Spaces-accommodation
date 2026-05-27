interface SmsPayload {
  to: string;
  body: string;
}

interface SmsResult {
  success: boolean;
  skipped?: boolean;
  provider: 'twilio';
  sid?: string;
}

const getOptionalEnv = (key: string) => Deno.env.get(key)?.trim();

export const sendSmsWithTwilio = async ({ to, body }: SmsPayload): Promise<SmsResult> => {
  const accountSid = getOptionalEnv('TWILIO_ACCOUNT_SID');
  const authToken = getOptionalEnv('TWILIO_AUTH_TOKEN');
  const fromNumber = getOptionalEnv('TWILIO_FROM_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[sms] Twilio is not configured. Skipping SMS send.', {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasFromNumber: !!fromNumber,
      to,
    });

    return {
      success: true,
      skipped: true,
      provider: 'twilio',
    };
  }

  const auth = btoa(`${accountSid}:${authToken}`);
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: body,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Twilio request failed: ${response.status} ${message}`);
  }

  const data = await response.json();

  return {
    success: true,
    provider: 'twilio',
    sid: data.sid,
  };
};
