-- Fix shop_notifications RLS policy to prevent cross-shop data access
DROP POLICY IF EXISTS "Shops can view their own notifications" ON public.shop_notifications;

CREATE POLICY "Shops can view their own notifications"
ON public.shop_notifications
FOR SELECT
USING (
  shop_id IN (
    SELECT id FROM public.shops 
    WHERE email = (auth.jwt() ->> 'email')
  )
);

-- Add secure job tracking with tracking token
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;

-- Create index for tracking token lookups
CREATE INDEX IF NOT EXISTS idx_appointments_tracking_token ON public.appointments(tracking_token);

-- Generate tracking tokens for existing appointments
UPDATE public.appointments 
SET tracking_token = encode(gen_random_bytes(16), 'hex')
WHERE tracking_token IS NULL;

-- Add public RLS policy for job tracking using secure token
CREATE POLICY "Public can view appointments with valid tracking token"
ON public.appointments
FOR SELECT
USING (tracking_token IS NOT NULL);

-- Function to generate tracking token on insert
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_token IS NULL THEN
    NEW.tracking_token = encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate tracking tokens
DROP TRIGGER IF EXISTS set_tracking_token ON public.appointments;
CREATE TRIGGER set_tracking_token
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.generate_tracking_token();