-- Allow shops to delete their own job offers (for declined jobs cleanup)
CREATE POLICY "Shops can delete their own job offers"
ON public.job_offers
FOR DELETE
USING (shop_id IN (
  SELECT id FROM shops WHERE email = (auth.jwt() ->> 'email'::text)
));