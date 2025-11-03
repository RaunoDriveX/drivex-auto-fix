-- Clear accepted jobs for Joseph Shop (soomer.joseph@gmail.com)
-- This is a one-time data operation

UPDATE job_offers 
SET status = 'declined', 
    decline_reason = 'Cleared by admin'
WHERE shop_id = 'soomer.joseph@gmail.com' 
  AND status = 'accepted';

UPDATE appointments 
SET status = 'cancelled',
    notes = COALESCE(notes || ' - ', '') || 'Cleared by admin'
WHERE shop_id = 'soomer.joseph@gmail.com' 
  AND status = 'confirmed';