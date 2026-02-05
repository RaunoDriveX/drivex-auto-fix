-- Create a cost estimate for the test job so insurer can approve it
INSERT INTO insurer_cost_estimates (
  appointment_id,
  line_items,
  labor_cost,
  parts_cost,
  total_cost,
  notes
) VALUES (
  '14200eff-7db3-4d16-84db-648072ab9dec',
  '[{"name": "Front Windshield Replacement", "description": "Stone chip - Replacement", "quantity": 1, "unit_price": 120}]'::jsonb,
  50,
  120,
  170,
  'Replacement recommended for stone chip damage'
);