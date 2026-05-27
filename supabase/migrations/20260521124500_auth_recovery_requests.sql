CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent'
);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS password_reset_requests_email_requested_at_idx
ON public.password_reset_requests (email, requested_at DESC);
