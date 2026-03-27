ALTER TABLE public.monthly_payment_requests
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Students can pay monthly payment requests" ON public.monthly_payment_requests;

CREATE POLICY "Participants can update monthly payment requests"
ON public.monthly_payment_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = student_id
  OR auth.uid() = owner_id
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  auth.uid() = student_id
  OR auth.uid() = owner_id
  OR public.has_role(auth.uid(), 'admin')
);
