-- Add customer address fields for proximity-based shop selection
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS customer_street TEXT,
ADD COLUMN IF NOT EXISTS customer_city TEXT,
ADD COLUMN IF NOT EXISTS customer_postal_code TEXT,
ADD COLUMN IF NOT EXISTS customer_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS customer_longitude NUMERIC;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_appointments_customer_location 
ON public.appointments(customer_latitude, customer_longitude) 
WHERE customer_latitude IS NOT NULL AND customer_longitude IS NOT NULL;

-- Comment on columns for documentation
COMMENT ON COLUMN public.appointments.customer_street IS 'Customer street address for proximity-based shop matching';
COMMENT ON COLUMN public.appointments.customer_city IS 'Customer city for proximity-based shop matching';
COMMENT ON COLUMN public.appointments.customer_postal_code IS 'Customer postal code for proximity-based shop matching';
COMMENT ON COLUMN public.appointments.customer_latitude IS 'Customer latitude for distance calculations';
COMMENT ON COLUMN public.appointments.customer_longitude IS 'Customer longitude for distance calculations';