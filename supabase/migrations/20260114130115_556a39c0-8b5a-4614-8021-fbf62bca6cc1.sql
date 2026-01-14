-- First drop ALL existing INSERT policies on appointments
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

-- Create a PERMISSIVE INSERT policy for anonymous and authenticated users
CREATE POLICY "Allow anyone to create appointments"
ON public.appointments
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Also add a SELECT policy so users can see the row they just created (needed for RETURNING)
DROP POLICY IF EXISTS "Anyone can view appointments by tracking_token" ON public.appointments;

CREATE POLICY "Anyone can view appointments by tracking_token"
ON public.appointments
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (tracking_token IS NOT NULL);