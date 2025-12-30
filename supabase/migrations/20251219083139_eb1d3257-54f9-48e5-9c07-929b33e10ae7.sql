-- Allow anyone to view insurer profiles for the booking dropdown
CREATE POLICY "Anyone can view insurer names for booking"
ON public.insurer_profiles
FOR SELECT
USING (true);