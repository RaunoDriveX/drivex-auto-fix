UPDATE appointments 
SET workflow_stage = 'customer_handover', 
    status = 'confirmed',
    updated_at = now()
WHERE short_code = '14200EFF';