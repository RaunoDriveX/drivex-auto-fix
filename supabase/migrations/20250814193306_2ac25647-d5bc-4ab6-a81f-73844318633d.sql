-- Fix the relationship between job_offers and appointments
-- First check if there's a mismatch in the appointment_id
UPDATE job_offers 
SET appointment_id = (
  SELECT id 
  FROM appointments 
  WHERE customer_email = 'sarah.mitchell@email.com' 
  LIMIT 1
)
WHERE shop_id = 'rauno.sigur@gmail.com' 
AND appointment_id IS NOT NULL;