-- Add ADAS calibration capability to shops table
ALTER TABLE public.shops 
ADD COLUMN adas_calibration_capability boolean DEFAULT false;

-- Add ADAS calibration requirement to appointments table
ALTER TABLE public.appointments 
ADD COLUMN requires_adas_calibration boolean DEFAULT false,
ADD COLUMN adas_calibration_reason text;

-- Add ADAS calibration requirement to job offers table
ALTER TABLE public.job_offers 
ADD COLUMN requires_adas_calibration boolean DEFAULT false,
ADD COLUMN adas_calibration_notes text;

-- Create function to detect ADAS calibration needs
CREATE OR REPLACE FUNCTION public.detect_adas_calibration_needs(
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  damage_type text,
  damage_location text DEFAULT null
) RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- ADAS calibration is required for vehicles 2015+ with windshield replacement
  -- or damage in driver view area for most makes
  IF vehicle_year >= 2015 AND (
    damage_type = 'windshield_replacement' OR
    damage_location ILIKE '%driver%' OR
    damage_location ILIKE '%center%' OR
    damage_type = 'replacement'
  ) THEN
    RETURN true;
  END IF;
  
  -- Specific makes that require calibration for any windshield work from earlier years
  IF vehicle_year >= 2010 AND UPPER(vehicle_make) IN ('TESLA', 'BMW', 'MERCEDES', 'AUDI', 'VOLVO', 'SUBARU') THEN
    RETURN true;
  END IF;
  
  -- Honda, Toyota, Nissan from 2018+ require calibration for most windshield work
  IF vehicle_year >= 2018 AND UPPER(vehicle_make) IN ('HONDA', 'TOYOTA', 'NISSAN', 'ACURA', 'LEXUS', 'INFINITI') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;