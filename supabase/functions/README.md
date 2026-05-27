## Edge Functions

Deploy these Supabase Edge Functions after pulling the latest changes:

- `send-booking-request-email`
- `send-admin-new-user-email`
- `send-welcome-email`
- `send-password-reset-email`
- `send-system-alert-email`
- `send-system-alert-sms`
- `create-razorpay-order`
- `verify-razorpay-payment`

Required secrets:

- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `ADMIN_ALERT_EMAIL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID` (optional for SMS)
- `TWILIO_AUTH_TOKEN` (optional for SMS)
- `TWILIO_FROM_NUMBER` (optional for SMS)
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Example commands:

```bash
supabase secrets set SENDGRID_API_KEY=your-key
supabase secrets set SENDGRID_FROM_EMAIL=no-reply@example.com
supabase secrets set ADMIN_ALERT_EMAIL=admin@example.com
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set RAZORPAY_KEY_ID=your-key-id
supabase secrets set RAZORPAY_KEY_SECRET=your-key-secret
supabase functions deploy send-booking-request-email
supabase functions deploy send-admin-new-user-email
supabase functions deploy send-welcome-email
supabase functions deploy send-password-reset-email
supabase functions deploy send-system-alert-email
supabase functions deploy send-system-alert-sms
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

Frontend env:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=your-key-id
```

Public functions:

- `send-welcome-email`
- `send-admin-new-user-email`
- `send-password-reset-email`

These include `config.toml` with `verify_jwt = false` so signup and forgot-password flows can invoke them safely before a user session exists.

Auth verification:

- Email confirmations are enabled in `supabase/config.toml` for local Supabase.
- For hosted Supabase, also enable email confirmations in Authentication settings.
- Use `supabase/templates/confirmation.html` as the branded Havenly Spaces confirmation template in production.
