-- Add column to track if customer has confirmed their appointment slot
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS appointment_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.appointments.appointment_confirmed_at IS 'Timestamp when customer confirmed their appointment slot. NULL means default/placeholder date.';