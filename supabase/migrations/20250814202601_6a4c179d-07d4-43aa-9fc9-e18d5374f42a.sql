-- Create enum for certification types
CREATE TYPE public.certification_type AS ENUM (
  'adas_calibration',
  'windshield_replacement',
  'mobile_service',
  'luxury_vehicle',
  'heavy_duty_vehicle',
  'laminated_glass',
  'tempered_glass',
  'heated_windshield',
  'heads_up_display',
  'rain_sensor',
  'tinted_glass'
);

-- Create technician certifications reference table
CREATE TABLE public.technician_certifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  certification_type certification_type NOT NULL,
  description text,
  required_for_jobs text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create shop technicians table
CREATE TABLE public.shop_technicians (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  years_experience integer DEFAULT 0,
  is_active boolean DEFAULT true,
  hire_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create junction table for technician certifications
CREATE TABLE public.shop_technician_certifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id uuid NOT NULL REFERENCES public.shop_technicians(id) ON DELETE CASCADE,
  certification_type certification_type NOT NULL,
  certified_date date NOT NULL DEFAULT current_date,
  expires_date date,
  certifying_body text,
  certificate_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(technician_id, certification_type)
);

-- Create job skill requirements table
CREATE TABLE public.job_skill_requirements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type text NOT NULL,
  damage_type text,
  vehicle_type text,
  required_certifications certification_type[] DEFAULT '{}',
  minimum_experience_years integer DEFAULT 0,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.technician_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_technician_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skill_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for technician_certifications (public read)
CREATE POLICY "Anyone can view certification types"
ON public.technician_certifications
FOR SELECT
USING (true);

-- RLS Policies for shop_technicians
CREATE POLICY "Shops can manage their own technicians"
ON public.shop_technicians
FOR ALL
USING (shop_id IN (
  SELECT id FROM public.shops WHERE email = (auth.jwt() ->> 'email')
));

CREATE POLICY "Shops can view their own technicians"
ON public.shop_technicians
FOR SELECT
USING (shop_id IN (
  SELECT id FROM public.shops WHERE email = (auth.jwt() ->> 'email')
));

-- RLS Policies for shop_technician_certifications
CREATE POLICY "Shops can manage their technicians' certifications"
ON public.shop_technician_certifications
FOR ALL
USING (technician_id IN (
  SELECT id FROM public.shop_technicians 
  WHERE shop_id IN (
    SELECT id FROM public.shops WHERE email = (auth.jwt() ->> 'email')
  )
));

-- RLS Policies for job_skill_requirements (public read for matching)
CREATE POLICY "Anyone can view job skill requirements"
ON public.job_skill_requirements
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_shop_technicians_updated_at
BEFORE UPDATE ON public.shop_technicians
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default certification types
INSERT INTO public.technician_certifications (name, certification_type, description, required_for_jobs) VALUES
('ADAS Calibration Certification', 'adas_calibration', 'Certified to calibrate Advanced Driver Assistance Systems', '{"windshield_replacement", "adas_calibration"}'),
('Windshield Replacement Specialist', 'windshield_replacement', 'Certified for complete windshield replacement', '{"windshield_replacement"}'),
('Mobile Service Technician', 'mobile_service', 'Certified for on-site mobile repairs', '{"mobile_repair"}'),
('Luxury Vehicle Specialist', 'luxury_vehicle', 'Certified to work on luxury and high-end vehicles', '{"luxury_repair"}'),
('Heavy Duty Vehicle Technician', 'heavy_duty_vehicle', 'Certified for trucks and commercial vehicles', '{"heavy_duty_repair"}'),
('Laminated Glass Specialist', 'laminated_glass', 'Certified to work with laminated glass systems', '{"laminated_glass_repair"}'),
('Tempered Glass Technician', 'tempered_glass', 'Certified for side and rear window replacement', '{"tempered_glass_repair"}'),
('Heated Windshield Specialist', 'heated_windshield', 'Certified for heated windshield systems', '{"heated_windshield_repair"}'),
('Heads-Up Display Technician', 'heads_up_display', 'Certified for HUD-equipped vehicles', '{"hud_repair"}'),
('Rain Sensor Specialist', 'rain_sensor', 'Certified for rain sensor calibration', '{"rain_sensor_repair"}'),
('Tinted Glass Technician', 'tinted_glass', 'Certified for factory-tinted glass work', '{"tinted_glass_repair"}');

-- Insert default job skill requirements
INSERT INTO public.job_skill_requirements (service_type, damage_type, required_certifications, minimum_experience_years, description) VALUES
('Windshield Replacement', 'replacement', '{"windshield_replacement"}', 2, 'Complete windshield replacement requires certified technician'),
('Windshield Replacement', 'adas_calibration', '{"windshield_replacement", "adas_calibration"}', 3, 'ADAS-equipped vehicles require dual certification'),
('Mobile Repair', NULL, '{"mobile_service"}', 1, 'On-site repairs require mobile service certification'),
('Luxury Vehicle Service', NULL, '{"luxury_vehicle"}', 3, 'Luxury vehicles require specialized training'),
('Heavy Duty Repair', NULL, '{"heavy_duty_vehicle"}', 2, 'Commercial vehicles require heavy duty certification'),
('Heated Windshield', 'replacement', '{"windshield_replacement", "heated_windshield"}', 2, 'Heated windshields require electrical knowledge'),
('HUD Repair', 'replacement', '{"windshield_replacement", "heads_up_display"}', 3, 'HUD systems require specialized calibration'),
('Rain Sensor Repair', NULL, '{"rain_sensor"}', 1, 'Rain sensor systems require calibration certification');

-- Create function to check if shop has qualified technicians for job
CREATE OR REPLACE FUNCTION public.shop_has_qualified_technicians(
  _shop_id text,
  _service_type text,
  _damage_type text DEFAULT NULL,
  _vehicle_type text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  required_certs public.certification_type[];
  min_experience integer;
  qualified_count integer;
BEGIN
  -- Get job requirements
  SELECT required_certifications, minimum_experience_years
  INTO required_certs, min_experience
  FROM public.job_skill_requirements
  WHERE service_type = _service_type
    AND (damage_type = _damage_type OR damage_type IS NULL)
    AND (vehicle_type = _vehicle_type OR vehicle_type IS NULL)
  ORDER BY 
    CASE WHEN damage_type = _damage_type THEN 1 ELSE 2 END,
    CASE WHEN vehicle_type = _vehicle_type THEN 1 ELSE 2 END
  LIMIT 1;

  -- If no requirements found, allow the job
  IF required_certs IS NULL THEN
    RETURN true;
  END IF;

  -- Check if shop has qualified technicians
  SELECT COUNT(DISTINCT st.id)
  INTO qualified_count
  FROM public.shop_technicians st
  WHERE st.shop_id = _shop_id
    AND st.is_active = true
    AND st.years_experience >= COALESCE(min_experience, 0)
    AND (
      required_certs = '{}' OR
      EXISTS (
        SELECT 1
        FROM public.shop_technician_certifications stc
        WHERE stc.technician_id = st.id
          AND stc.certification_type = ANY(required_certs)
          AND (stc.expires_date IS NULL OR stc.expires_date > current_date)
      )
    );

  RETURN qualified_count > 0;
END;
$$;