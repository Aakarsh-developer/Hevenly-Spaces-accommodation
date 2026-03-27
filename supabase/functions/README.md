## Edge Functions

Deploy these Supabase Edge Functions after pulling the latest changes:

- `send-booking-request-email`
- `send-admin-new-user-email`
- `create-razorpay-order`
- `verify-razorpay-payment`

Required secrets:

- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `ADMIN_ALERT_EMAIL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Example commands:

```bash
supabase secrets set SENDGRID_API_KEY=your-key
supabase secrets set SENDGRID_FROM_EMAIL=no-reply@example.com
supabase secrets set ADMIN_ALERT_EMAIL=admin@example.com
supabase secrets set RAZORPAY_KEY_ID=your-key-id
supabase secrets set RAZORPAY_KEY_SECRET=your-key-secret
supabase functions deploy send-booking-request-email
supabase functions deploy send-admin-new-user-email
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

Frontend env:

```bash
VITE_RAZORPAY_KEY_ID=your-key-id
```
