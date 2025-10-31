-- Fix broken webhook secret management functions
CREATE OR REPLACE FUNCTION public.set_webhook_secret(
  _config_id uuid,
  _secret text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Only store a hash of the secret. Never store the plaintext secret.
  UPDATE public.insurer_webhook_configs
  SET 
    webhook_secret_hash = encode(digest(_secret, 'sha256'), 'hex'),
    updated_at = now()
  WHERE id = _config_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_webhook_signature(
  _config_id uuid,
  _signature text,
  _payload text,
  _secret text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  stored_hash text;
  provided_hash text;
  computed_signature text;
BEGIN
  -- Fetch the stored secret hash for the active config
  SELECT webhook_secret_hash INTO stored_hash
  FROM public.insurer_webhook_configs
  WHERE id = _config_id AND is_active = true;

  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verify that the provided secret matches the stored hash
  provided_hash := encode(digest(_secret, 'sha256'), 'hex');
  IF provided_hash <> stored_hash THEN
    RETURN FALSE;
  END IF;

  -- Compute HMAC of the payload using the provided secret and compare
  computed_signature := encode(hmac(_payload, _secret, 'sha256'), 'hex');
  RETURN computed_signature = _signature;
END;
$$;

-- Harden SECURITY DEFINER helper functions to prevent RLS bypass and information disclosure
CREATE OR REPLACE FUNCTION public.is_insurer_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent cross-user enumeration; only allow check for the calling user
  IF _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.insurer_users
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_insurer_id(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result uuid;
BEGIN
  -- Prevent cross-user lookups; only return for the calling user
  IF _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN NULL;
  END IF;

  SELECT insurer_id INTO result
  FROM public.insurer_users
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;

  RETURN result;
END;
$$;

-- Pin search_path for SECURITY DEFINER business function
ALTER FUNCTION public.check_oem_requirements(text, text, integer, text)
  SECURITY DEFINER
  SET search_path = public;

-- Tighten Storage RLS for damage photos bucket
-- Remove overly-permissive policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view damage photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload damage photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own damage photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own damage photos" ON storage.objects;

-- Read access
CREATE POLICY "Customers can view own damage photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.appointments
    WHERE customer_email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Shops can view assigned appointment photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.appointments
    WHERE shop_id IN (
      SELECT id FROM public.shops WHERE email = (auth.jwt() ->> 'email')
    )
  )
);

CREATE POLICY "Insurers can view photos for their claims"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT a.id::text
    FROM public.appointments a
    JOIN public.insurer_profiles ip ON ip.insurer_name = a.insurer_name
    WHERE ip.email = (auth.jwt() ->> 'email')
  )
);

-- Uploads (INSERT)
CREATE POLICY "Customers can upload own damage photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.appointments
    WHERE customer_email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Shops can upload assigned appointment photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.appointments
    WHERE shop_id IN (
      SELECT id FROM public.shops WHERE email = (auth.jwt() ->> 'email')
    )
  )
);

-- Updates
CREATE POLICY "Customers can update own damage photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.appointments
    WHERE customer_email = (auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.appointments
    WHERE customer_email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Shops can update assigned appointment photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.appointments
    WHERE shop_id IN (
      SELECT id FROM public.shops WHERE email = (auth.jwt() ->> 'email')
    )
  )
)
WITH CHECK (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.appointments
    WHERE shop_id IN (
      SELECT id FROM public.shops WHERE email = (auth.jwt() ->> 'email')
    )
  )
);

-- Deletes
CREATE POLICY "Customers can delete own damage photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.appointments
    WHERE customer_email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Shops can delete assigned appointment photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'damage-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.appointments
    WHERE shop_id IN (
      SELECT id FROM public.shops WHERE email = (auth.jwt() ->> 'email')
    )
  )
);
