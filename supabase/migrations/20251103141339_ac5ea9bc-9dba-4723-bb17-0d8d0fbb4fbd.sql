-- Update vehicle information for booking 37BC68DF
UPDATE appointments 
SET vehicle_info = jsonb_build_object(
  'licensePlate', '057HKH',
  'make', 'Alfa Romeo',
  'model', 'Giulia Veloce',
  'year', 2019,
  'vin', 'ZAREAFDN0K7617281'
)
WHERE short_code = '37BC68DF';