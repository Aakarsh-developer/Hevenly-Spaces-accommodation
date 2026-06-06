ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_upi_id_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_upi_id_check
CHECK (
  upi_id IS NULL
  OR upi_id ~ '^[A-Za-z0-9._-]+@[A-Za-z]+$'
);

NOTIFY pgrst, 'reload schema';
