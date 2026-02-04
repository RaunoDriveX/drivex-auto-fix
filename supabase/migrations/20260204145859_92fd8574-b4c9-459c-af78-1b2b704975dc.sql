-- Add policy to allow shops to insert cost estimates for their assigned appointments
CREATE POLICY "Shops can insert cost estimates for their appointments"
ON public.insurer_cost_estimates
FOR INSERT
TO authenticated
WITH CHECK (
  appointment_id IN (
    SELECT a.id 
    FROM appointments a 
    WHERE a.shop_id::text IN (
      SELECT s.id::text FROM shops s WHERE s.email = (auth.jwt() ->> 'email'::text)
    )
  )
);

-- Add policy to allow shops to view their submitted cost estimates
CREATE POLICY "Shops can view their cost estimates"
ON public.insurer_cost_estimates
FOR SELECT
TO authenticated
USING (
  created_by::text IN (
    SELECT s.id::text FROM shops s WHERE s.email = (auth.jwt() ->> 'email'::text)
  )
);