CREATE TABLE public.agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL UNIQUE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  monthly_rent INTEGER NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_months INTEGER NOT NULL DEFAULT 11,
  rules TEXT[] NOT NULL DEFAULT ARRAY[
    'Rent must be paid on time every month',
    'No property damage is allowed',
    'Follow building and community rules'
  ]::text[],
  content TEXT NOT NULL,
  owner_accepted BOOLEAN NOT NULL DEFAULT true,
  student_accepted BOOLEAN NOT NULL DEFAULT false,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  payer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  kind TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'mock_gateway',
  status TEXT NOT NULL DEFAULT 'paid',
  reference TEXT NOT NULL UNIQUE,
  payment_request_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.monthly_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  due_month DATE NOT NULL,
  due_date DATE NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

ALTER TABLE public.payment_transactions
ADD CONSTRAINT payment_transactions_payment_request_id_fkey
FOREIGN KEY (payment_request_id) REFERENCES public.monthly_payment_requests(id) ON DELETE SET NULL;

ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view agreements"
ON public.agreements
FOR SELECT
TO authenticated
USING (auth.uid() = student_id OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can manage agreements"
ON public.agreements
FOR ALL
TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can accept agreements"
ON public.agreements
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can view payment transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = payer_id OR auth.uid() = payee_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can create payment transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Participants can view monthly payment requests"
ON public.monthly_payment_requests
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id OR auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can create monthly payment requests"
ON public.monthly_payment_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id
  AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = booking_id
      AND b.owner_id = auth.uid()
      AND b.student_id = student_id
      AND b.status = 'accepted'
  )
);

CREATE POLICY "Students can pay monthly payment requests"
ON public.monthly_payment_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX monthly_payment_requests_unique_booking_month_idx
ON public.monthly_payment_requests (booking_id, due_month);
