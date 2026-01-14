-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

-- Create a new INSERT policy that explicitly allows anon and authenticated users
CREATE POLICY "Anyone can create appointments"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);