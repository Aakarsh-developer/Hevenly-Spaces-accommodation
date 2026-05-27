ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS upi_id TEXT;

UPDATE public.profiles
SET full_name = COALESCE(full_name, name)
WHERE full_name IS NULL;

UPDATE public.profiles
SET name = COALESCE(name, full_name)
WHERE name IS NULL
  AND full_name IS NOT NULL;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

NOTIFY pgrst, 'reload schema';
