-- Fix the appointment that was declined before edge function was updated
UPDATE appointments 
SET status = 'cancelled', 
    job_status = 'cancelled', 
    notes = 'Declined by shop'
WHERE id = '85698c65-966f-4220-81b6-2a244807b1d3' 
  AND status = 'pending';