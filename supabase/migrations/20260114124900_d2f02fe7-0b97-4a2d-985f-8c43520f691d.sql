-- Add preferred_contact_method column to store how the customer wants to be contacted
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT;

-- Add a check constraint for valid values
ALTER TABLE public.appointments 
ADD CONSTRAINT valid_contact_method 
CHECK (preferred_contact_method IS NULL OR preferred_contact_method IN ('email', 'phone', 'whatsapp'));