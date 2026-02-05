-- Update the job offer to accepted status since the workflow has progressed
UPDATE job_offers 
SET status = 'accepted', 
    responded_at = now()
WHERE appointment_id = '14200eff-7db3-4d16-84db-648072ab9dec' 
  AND status = 'offered';