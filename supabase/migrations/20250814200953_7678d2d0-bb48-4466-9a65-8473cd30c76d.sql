-- Create upsell services table
CREATE TABLE upsell_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  typical_price_min NUMERIC(10,2),
  typical_price_max NUMERIC(10,2),
  duration_minutes INTEGER DEFAULT 30,
  requires_parts BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert standard upsell services
INSERT INTO upsell_services (name, description, category, typical_price_min, typical_price_max, duration_minutes, requires_parts) VALUES
('Windshield Insurance', 'Comprehensive windshield protection coverage', 'insurance', 50.00, 150.00, 10, false),
('New Windshield Wipers', 'Premium windshield wiper blade replacement', 'maintenance', 25.00, 80.00, 20, true),
('Ceramic Coating', 'Hydrophobic ceramic coating for windshield', 'enhancement', 100.00, 300.00, 60, true),
('Windshield Replacement', 'Complete windshield replacement service', 'replacement', 200.00, 800.00, 120, true),
('ADAS Recalibration', 'Advanced Driver Assistance System recalibration', 'technical', 150.00, 400.00, 90, false),
('Headlight Replacement', 'Front headlight bulb or assembly replacement', 'lighting', 40.00, 200.00, 45, true),
('Taillight Replacement', 'Rear taillight bulb or assembly replacement', 'lighting', 30.00, 150.00, 30, true),
('Mirror Replacement', 'Side or rearview mirror replacement', 'replacement', 80.00, 350.00, 60, true),
('Oil Change', 'Engine oil and filter change service', 'maintenance', 30.00, 100.00, 45, true),
('Tire Pressure Check', 'Complete tire pressure inspection and adjustment', 'maintenance', 15.00, 40.00, 20, false);

-- Create shop upsell offerings table
CREATE TABLE shop_upsell_offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL,
  upsell_service_id UUID NOT NULL REFERENCES upsell_services(id),
  custom_price NUMERIC(10,2),
  custom_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, upsell_service_id)
);

-- Enable RLS
ALTER TABLE upsell_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_upsell_offerings ENABLE ROW LEVEL SECURITY;

-- RLS policies for upsell_services (public read)
CREATE POLICY "Anyone can view upsell services" 
ON upsell_services FOR SELECT 
USING (true);

-- RLS policies for shop_upsell_offerings
CREATE POLICY "Shops can view all upsell offerings" 
ON shop_upsell_offerings FOR SELECT 
USING (true);

CREATE POLICY "Shops can manage their own upsell offerings" 
ON shop_upsell_offerings FOR ALL 
USING (shop_id IN (SELECT id FROM shops WHERE email = (auth.jwt() ->> 'email')));

-- Create job offer upsells table
CREATE TABLE job_offer_upsells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_offer_id UUID NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  upsell_service_id UUID NOT NULL REFERENCES upsell_services(id),
  offered_price NUMERIC(10,2) NOT NULL,
  description TEXT,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE job_offer_upsells ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_offer_upsells
CREATE POLICY "Shops can view upsells for their job offers" 
ON job_offer_upsells FOR SELECT 
USING (job_offer_id IN (SELECT id FROM job_offers WHERE shop_id IN (SELECT id FROM shops WHERE email = (auth.jwt() ->> 'email'))));

CREATE POLICY "Shops can manage upsells for their job offers" 
ON job_offer_upsells FOR ALL 
USING (job_offer_id IN (SELECT id FROM job_offers WHERE shop_id IN (SELECT id FROM shops WHERE email = (auth.jwt() ->> 'email'))));

-- Add trigger for updating timestamps
CREATE TRIGGER update_shop_upsell_offerings_updated_at
BEFORE UPDATE ON shop_upsell_offerings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();