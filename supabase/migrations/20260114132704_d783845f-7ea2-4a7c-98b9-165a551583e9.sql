-- Add DELETE policy for insurers to remove cancelled appointments
CREATE POLICY "Insurers can delete cancelled appointments for their company"
ON public.appointments
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  job_status = 'cancelled' 
  AND insurer_name IN (
    SELECT insurer_profiles.insurer_name
    FROM insurer_profiles
    WHERE insurer_profiles.email = (auth.jwt() ->> 'email'::text)
  )
);