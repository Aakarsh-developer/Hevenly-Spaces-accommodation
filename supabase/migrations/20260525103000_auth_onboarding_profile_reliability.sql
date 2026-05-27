ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS upi_id TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role TEXT;
  safe_role public.app_role;
  resolved_name TEXT;
BEGIN
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  safe_role := CASE
    WHEN requested_role = 'owner' THEN 'owner'::public.app_role
    ELSE 'student'::public.app_role
  END;
  resolved_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, name, full_name, email)
  VALUES (NEW.id, resolved_name, resolved_name, NEW.email)
  ON CONFLICT (id) DO UPDATE
  SET
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    email = COALESCE(public.profiles.email, EXCLUDED.email);

  DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = 'admin';

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, safe_role);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_user_row auth.users%ROWTYPE;
  requested_role TEXT;
  safe_role public.app_role;
  resolved_name TEXT;
  profile_row public.profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO auth_user_row FROM auth.users WHERE id = auth.uid();
  IF auth_user_row.id IS NULL THEN
    RAISE EXCEPTION 'Authenticated user was not found';
  END IF;

  requested_role := COALESCE(auth_user_row.raw_user_meta_data->>'role', 'student');
  safe_role := CASE
    WHEN requested_role = 'owner' THEN 'owner'::public.app_role
    ELSE 'student'::public.app_role
  END;
  resolved_name := COALESCE(NULLIF(auth_user_row.raw_user_meta_data->>'name', ''), split_part(auth_user_row.email, '@', 1));

  INSERT INTO public.profiles (id, name, full_name, email)
  VALUES (auth_user_row.id, resolved_name, resolved_name, auth_user_row.email)
  ON CONFLICT (id) DO UPDATE
  SET
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    email = COALESCE(public.profiles.email, EXCLUDED.email)
  RETURNING * INTO profile_row;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth_user_row.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth_user_row.id, safe_role);
  END IF;

  RETURN profile_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

NOTIFY pgrst, 'reload schema';
