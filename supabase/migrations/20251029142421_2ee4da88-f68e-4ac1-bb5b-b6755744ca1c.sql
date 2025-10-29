-- Fix Issue #1: Add search_path to security definer functions to prevent schema injection
CREATE OR REPLACE FUNCTION public.is_insurer_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.insurer_users
    WHERE user_id = _user_id
      AND role = 'admin'
      AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_insurer_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT insurer_id
  FROM public.insurer_users
  WHERE user_id = _user_id
    AND is_active = true
  LIMIT 1
$$;

-- Fix Issue #2: Remove overly permissive storage policies
DROP POLICY IF EXISTS "System can manage invoice storage" ON storage.objects;
DROP POLICY IF EXISTS "System can manage completion proof storage" ON storage.objects;

-- Fix Issue #3: Remove overly broad public tracking token policy
DROP POLICY IF EXISTS "Public can view appointments with valid tracking token" ON public.appointments;

-- Fix Issue #4: Implement webhook secret hash storage for verification
-- Add column to store hash of webhook secret for verification
ALTER TABLE public.insurer_webhook_configs 
ADD COLUMN IF NOT EXISTS webhook_secret_hash TEXT;

-- Create function to set webhook secret with hash
CREATE OR REPLACE FUNCTION public.set_webhook_secret(
  _config_id UUID,
  _secret TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Store plaintext secret and its hash
  UPDATE public.insurer_webhook_configs
  SET 
    webhook_secret = _secret,
    webhook_secret_hash = encode(digest(_secret, 'sha256'), 'hex'),
    updated_at = now()
  WHERE id = _config_id;
END;
$$;

-- Create function to verify webhook signature
CREATE OR REPLACE FUNCTION public.verify_webhook_signature(
  _config_id UUID,
  _signature TEXT,
  _payload TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash TEXT;
  computed_signature TEXT;
  secret TEXT;
BEGIN
  -- Get the webhook secret
  SELECT webhook_secret INTO secret
  FROM public.insurer_webhook_configs
  WHERE id = _config_id AND is_active = true;
  
  IF secret IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Compute HMAC signature
  computed_signature := encode(
    hmac(_payload, secret, 'sha256'),
    'hex'
  );
  
  -- Compare signatures
  RETURN _signature = computed_signature;
END;
$$;

-- Update existing webhook secrets to include hash
UPDATE public.insurer_webhook_configs
SET webhook_secret_hash = encode(digest(webhook_secret, 'sha256'), 'hex')
WHERE webhook_secret IS NOT NULL AND webhook_secret_hash IS NULL;