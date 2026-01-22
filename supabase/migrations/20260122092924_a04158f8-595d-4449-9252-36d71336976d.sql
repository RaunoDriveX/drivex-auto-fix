-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Insurers can delete cancelled appointments for their company" ON public.appointments;

-- Create new policy that allows insurers to delete:
-- 1. Cancelled jobs
-- 2. New jobs that haven't been assigned to a shop yet (shop_id IS NULL or status = 'pending')
CREATE POLICY "Insurers can delete their appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  insurer_name IN (
    SELECT insurer_profiles.insurer_name
    FROM insurer_profiles
    WHERE insurer_profiles.email = (auth.jwt() ->> 'email'::text)
  )
  AND (
    job_status = 'cancelled'::job_status_type
    OR shop_id IS NULL
    OR status = 'pending'
  )
);