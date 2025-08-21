-- Add RLS policy for insurers to view their own appointments
CREATE POLICY "Insurers can view appointments for their company" 
ON appointments 
FOR SELECT 
USING (
  insurer_name IN (
    SELECT insurer_name 
    FROM insurer_profiles 
    WHERE email = (auth.jwt() ->> 'email'::text)
  )
);