-- Create parts fitment requirements table
CREATE TABLE public.parts_fitment_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT,
  year_from INTEGER NOT NULL,
  year_to INTEGER NOT NULL,
  damage_type TEXT NOT NULL,
  requires_oem BOOLEAN DEFAULT false,
  calibration_sensitive BOOLEAN DEFAULT false,
  reason TEXT,
  part_specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parts sourcing requests table
CREATE TABLE public.parts_sourcing_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL,
  job_offer_id UUID REFERENCES public.job_offers(id) ON DELETE CASCADE,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT,
  vehicle_year INTEGER NOT NULL,
  part_type TEXT NOT NULL,
  oem_required BOOLEAN DEFAULT false,
  requested_delivery_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'ordered', 'delivered', 'cancelled')),
  supplier_quote JSONB DEFAULT '{}'::jsonb,
  estimated_cost NUMERIC,
  estimated_delivery_days INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parts_fitment_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_sourcing_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for parts_fitment_requirements
CREATE POLICY "Anyone can view parts fitment requirements" 
ON public.parts_fitment_requirements 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage parts fitment requirements" 
ON public.parts_fitment_requirements 
FOR ALL 
USING (true);

-- Create policies for parts_sourcing_requests
CREATE POLICY "Shops can view their own sourcing requests" 
ON public.parts_sourcing_requests 
FOR SELECT 
USING (shop_id IN (
  SELECT shops.id FROM shops 
  WHERE shops.email = (auth.jwt() ->> 'email')
));

CREATE POLICY "Shops can create their own sourcing requests" 
ON public.parts_sourcing_requests 
FOR INSERT 
WITH CHECK (shop_id IN (
  SELECT shops.id FROM shops 
  WHERE shops.email = (auth.jwt() ->> 'email')
));

CREATE POLICY "Shops can update their own sourcing requests" 
ON public.parts_sourcing_requests 
FOR UPDATE 
USING (shop_id IN (
  SELECT shops.id FROM shops 
  WHERE shops.email = (auth.jwt() ->> 'email')
));

CREATE POLICY "System can manage all sourcing requests" 
ON public.parts_sourcing_requests 
FOR ALL 
USING (true);

-- Create function to check OEM requirements (fixed parameter defaults)
CREATE OR REPLACE FUNCTION public.check_oem_requirements(
  _vehicle_make TEXT,
  _vehicle_model TEXT,
  _vehicle_year INTEGER,
  _damage_type TEXT
) RETURNS JSONB AS $$
DECLARE
  requirement_found RECORD;
  result JSONB;
BEGIN
  -- Look for specific fitment requirements
  SELECT * INTO requirement_found
  FROM public.parts_fitment_requirements
  WHERE UPPER(vehicle_make) = UPPER(_vehicle_make)
    AND (_vehicle_model IS NULL OR UPPER(vehicle_model) = UPPER(_vehicle_model) OR vehicle_model IS NULL)
    AND _vehicle_year >= year_from 
    AND _vehicle_year <= year_to
    AND damage_type = _damage_type
  ORDER BY 
    CASE WHEN vehicle_model = _vehicle_model THEN 1 ELSE 2 END,
    year_from DESC
  LIMIT 1;

  IF requirement_found.id IS NOT NULL THEN
    result := jsonb_build_object(
      'requires_oem', requirement_found.requires_oem,
      'calibration_sensitive', requirement_found.calibration_sensitive,
      'reason', requirement_found.reason,
      'part_specifications', requirement_found.part_specifications,
      'requirement_id', requirement_found.id
    );
  ELSE
    -- Default logic for common OEM requirements
    result := jsonb_build_object(
      'requires_oem', 
      CASE 
        -- Luxury brands typically need OEM for ADAS
        WHEN UPPER(_vehicle_make) IN ('BMW', 'MERCEDES', 'AUDI', 'LEXUS', 'ACURA', 'INFINITI', 'CADILLAC', 'LINCOLN') 
          AND _damage_type IN ('windshield_replacement', 'replacement') 
          AND _vehicle_year >= 2015 THEN true
        -- Tesla always needs OEM
        WHEN UPPER(_vehicle_make) = 'TESLA' THEN true
        -- Modern vehicles with windshield replacement often need OEM for ADAS
        WHEN _damage_type IN ('windshield_replacement', 'replacement') 
          AND _vehicle_year >= 2018 THEN true
        ELSE false
      END,
      'calibration_sensitive', 
      CASE 
        WHEN _damage_type IN ('windshield_replacement', 'replacement') 
          AND _vehicle_year >= 2015 THEN true
        ELSE false
      END,
      'reason', 
      CASE 
        WHEN UPPER(_vehicle_make) = 'TESLA' THEN 'Tesla requires OEM glass for all repairs'
        WHEN UPPER(_vehicle_make) IN ('BMW', 'MERCEDES', 'AUDI', 'LEXUS', 'ACURA', 'INFINITI') 
          AND _vehicle_year >= 2015 THEN 'Luxury vehicle ADAS calibration requires OEM glass'
        WHEN _damage_type IN ('windshield_replacement', 'replacement') 
          AND _vehicle_year >= 2018 THEN 'Modern ADAS systems require OEM glass for proper calibration'
        ELSE 'Aftermarket glass acceptable for this vehicle'
      END,
      'part_specifications', '{}'::jsonb,
      'requirement_id', null
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some common fitment requirements
INSERT INTO public.parts_fitment_requirements (vehicle_make, vehicle_model, year_from, year_to, damage_type, requires_oem, calibration_sensitive, reason, part_specifications) VALUES
-- Tesla requirements
('TESLA', NULL, 2012, 2030, 'windshield_replacement', true, true, 'Tesla requires OEM glass for all windshield replacements', '{"supplier": "Tesla", "lead_time_days": 3}'),
('TESLA', NULL, 2012, 2030, 'replacement', true, true, 'Tesla requires OEM glass for all glass replacements', '{"supplier": "Tesla", "lead_time_days": 3}'),

-- BMW requirements
('BMW', NULL, 2015, 2030, 'windshield_replacement', true, true, 'BMW vehicles with ADAS require OEM glass for calibration accuracy', '{"supplier": "BMW", "alternatives": ["Pilkington", "Guardian"], "lead_time_days": 2}'),

-- Mercedes requirements  
('MERCEDES', NULL, 2015, 2030, 'windshield_replacement', true, true, 'Mercedes vehicles with ADAS require OEM glass for calibration accuracy', '{"supplier": "Mercedes", "alternatives": ["Pilkington", "Guardian"], "lead_time_days": 2}'),

-- Audi requirements
('AUDI', NULL, 2015, 2030, 'windshield_replacement', true, true, 'Audi vehicles with ADAS require OEM glass for calibration accuracy', '{"supplier": "Audi", "alternatives": ["Pilkington", "Guardian"], "lead_time_days": 2}'),

-- General modern vehicle requirements
('HONDA', NULL, 2018, 2030, 'windshield_replacement', true, true, 'Honda Sensing requires OEM or OEM-equivalent glass', '{"alternatives": ["Pilkington", "Guardian", "Safelite"], "lead_time_days": 1}'),
('TOYOTA', NULL, 2018, 2030, 'windshield_replacement', true, true, 'Toyota Safety Sense requires OEM or OEM-equivalent glass', '{"alternatives": ["Pilkington", "Guardian", "Safelite"], "lead_time_days": 1}'),
('FORD', NULL, 2017, 2030, 'windshield_replacement', true, true, 'Ford Co-Pilot360 requires OEM or OEM-equivalent glass', '{"alternatives": ["Pilkington", "Guardian", "Safelite"], "lead_time_days": 1}'),
('CHEVROLET', NULL, 2018, 2030, 'windshield_replacement', true, true, 'Chevrolet Safety Assist requires OEM or OEM-equivalent glass', '{"alternatives": ["Pilkington", "Guardian", "Safelite"], "lead_time_days": 1}');

-- Create triggers for updated_at
CREATE TRIGGER update_parts_fitment_requirements_updated_at
  BEFORE UPDATE ON public.parts_fitment_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parts_sourcing_requests_updated_at
  BEFORE UPDATE ON public.parts_sourcing_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();