-- Add RLS policy to allow shops to view appointments for their job offers
CREATE POLICY "Shops can view appointments for their job offers" 
ON public.appointments 
FOR SELECT 
USING (
  shop_id IN ( 
    SELECT id 
    FROM shops 
    WHERE email = (auth.jwt() ->> 'email'::text)
  )
  OR 
  id IN (
    SELECT appointment_id 
    FROM job_offers 
    WHERE shop_id IN (
      SELECT id 
      FROM shops 
      WHERE email = (auth.jwt() ->> 'email'::text)
    )
  )
);