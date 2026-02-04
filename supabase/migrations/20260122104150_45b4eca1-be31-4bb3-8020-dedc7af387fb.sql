UPDATE appointments 
SET workflow_stage = 'cost_approval', 
    customer_cost_approved = false,
    customer_cost_approved_at = NULL
WHERE short_code = 'B2A9FA67'