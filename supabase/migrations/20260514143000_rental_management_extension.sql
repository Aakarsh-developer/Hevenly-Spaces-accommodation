ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS upi_id TEXT;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_mobile_number_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_mobile_number_check
CHECK (
  mobile_number IS NULL
  OR mobile_number ~ '^\+?[1-9][0-9]{9,14}$'
);

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_upi_id_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_upi_id_check
CHECK (
  upi_id IS NULL
  OR upi_id ~ '^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$'
);

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS rent_due_date DATE,
ADD COLUMN IF NOT EXISTS next_payment_date DATE,
ADD COLUMN IF NOT EXISTS last_successful_payment_date TIMESTAMPTZ;

ALTER TABLE public.monthly_payment_requests
ADD COLUMN IF NOT EXISTS note TEXT,
ADD COLUMN IF NOT EXISTS owner_response_note TEXT,
ADD COLUMN IF NOT EXISTS period_label TEXT;

ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_signature TEXT,
ADD COLUMN IF NOT EXISTS payer_name TEXT,
ADD COLUMN IF NOT EXISTS payer_email TEXT,
ADD COLUMN IF NOT EXISTS payer_phone TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS owner_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS owner_confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.payment_date_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  payment_request_id UUID REFERENCES public.monthly_payment_requests(id) ON DELETE SET NULL,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responder_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  current_due_date DATE NOT NULL,
  requested_due_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT payment_date_change_requests_date_check CHECK (requested_due_date > current_due_date),
  CONSTRAINT payment_date_change_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE public.payment_date_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view payment date change requests"
ON public.payment_date_change_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = payment_date_change_requests.booking_id
      AND (
        auth.uid() = b.student_id
        OR auth.uid() = b.owner_id
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

CREATE POLICY "Students can create payment date change requests"
ON public.payment_date_change_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requester_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = payment_date_change_requests.booking_id
      AND b.student_id = auth.uid()
  )
);

CREATE POLICY "Participants can update payment date change requests"
ON public.payment_date_change_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = payment_date_change_requests.booking_id
      AND (
        auth.uid() = b.student_id
        OR auth.uid() = b.owner_id
        OR public.has_role(auth.uid(), 'admin')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = payment_date_change_requests.booking_id
      AND (
        auth.uid() = b.student_id
        OR auth.uid() = b.owner_id
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note TEXT,
  CONSTRAINT user_reports_status_check CHECK (status IN ('open', 'reviewed', 'resolved'))
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view user reports"
ON public.user_reports
FOR SELECT
TO authenticated
USING (
  reporter_id = auth.uid()
  OR reported_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Participants can create user reports"
ON public.user_reports
FOR INSERT
TO authenticated
WITH CHECK (
  reporter_id = auth.uid()
);

CREATE POLICY "Admins can update user reports"
ON public.user_reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS payment_date_change_requests_booking_idx
ON public.payment_date_change_requests (booking_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS user_reports_reported_user_idx
ON public.user_reports (reported_user_id, status, created_at DESC);
