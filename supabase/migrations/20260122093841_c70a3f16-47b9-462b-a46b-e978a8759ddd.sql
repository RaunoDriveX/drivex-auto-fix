-- Add columns to appointments table to track shop selection changes
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS selection_modified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS selection_change_accepted BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS previous_shop_selection TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.appointments.selection_modified_at IS 'Timestamp when insurer modified the shop selections after initial submission';
COMMENT ON COLUMN public.appointments.selection_change_accepted IS 'Customer response to selection changes: true=accepted, false=declined, null=pending';
COMMENT ON COLUMN public.appointments.previous_shop_selection IS 'The shop ID the customer previously selected before changes were made';