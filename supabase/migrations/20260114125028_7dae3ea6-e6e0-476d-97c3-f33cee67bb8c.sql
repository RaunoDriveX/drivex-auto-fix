-- Allow anonymous users to update appointments they created (by tracking_token)
CREATE POLICY "Anyone can update appointments by tracking_token"
ON public.appointments
FOR UPDATE
TO anon, authenticated
USING (tracking_token IS NOT NULL)
WITH CHECK (tracking_token IS NOT NULL);