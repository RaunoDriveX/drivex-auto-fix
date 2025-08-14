-- Insert mock appointment for Staapli 3 chip repair case
INSERT INTO public.appointments (
  customer_name,
  customer_email,
  customer_phone,
  shop_id,
  service_type,
  damage_type,
  appointment_date,
  appointment_time,
  vehicle_info,
  notes,
  is_insurance_claim,
  damage_photos,
  additional_notes,
  status,
  total_cost
) VALUES (
  'Sarah Mitchell',
  'sarah.mitchell@email.com',
  '+1-555-0187',
  'rauno.sigur@gmail.com',
  'Windshield Chip Repair',
  'chip_repair',
  '2025-08-16',
  '10:30',
  '{"make": "Toyota", "model": "Camry", "year": "2019", "color": "Silver", "vin": "1HGBH41JXMN109186"}',
  'Small chip in driver side view area, about 6mm diameter. Occurred from road debris on highway. No spreading observed yet.',
  false,
  ARRAY[
    '/lovable-uploads/55656e15-f7f7-4cf3-9e95-1f90feeb7a19.png',
    '/lovable-uploads/5cafe942-1574-4628-a9df-559fb4bd6d49.png'
  ],
  'Customer prefers mobile service if available. Vehicle is parked at office building with covered parking.',
  'pending',
  89.99
);

-- Insert corresponding job offer
INSERT INTO public.job_offers (
  shop_id,
  appointment_id,
  offered_price,
  status,
  expires_at,
  estimated_completion_time,
  notes
) VALUES (
  'rauno.sigur@gmail.com',
  (SELECT id FROM public.appointments WHERE customer_email = 'sarah.mitchell@email.com' LIMIT 1),
  89.99,
  'offered',
  NOW() + INTERVAL '6 hours',
  '45 minutes',
  'Standard chip repair using UV resin. Quality warranty included. Mobile service available for this location.'
);