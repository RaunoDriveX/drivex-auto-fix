-- Grant necessary permissions to anon and authenticated roles for appointments table
-- This allows users to create appointments even when not logged in

GRANT SELECT, INSERT ON public.appointments TO anon;
GRANT SELECT, INSERT, UPDATE ON public.appointments TO authenticated;

-- Also ensure the sequence for UUID generation is accessible
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;