-- Create appointments table first
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shop_id TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'repair',
  damage_type TEXT,
  vehicle_info JSONB,
  total_cost DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  is_insurance_claim BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Users can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (customer_email = (current_setting('request.jwt.claims', true)::json->>'email')::text);

CREATE POLICY "Anyone can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own appointments" 
ON public.appointments 
FOR UPDATE 
USING (customer_email = (current_setting('request.jwt.claims', true)::json->>'email')::text);

-- Create shops table with comprehensive details
CREATE TABLE public.shops (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_mobile_service BOOLEAN DEFAULT FALSE,
  is_certified BOOLEAN DEFAULT FALSE,
  insurance_approved BOOLEAN DEFAULT TRUE,
  business_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Public read access to shops
CREATE POLICY "Anyone can view shops" 
ON public.shops 
FOR SELECT 
USING (true);

-- Create shop availability table
CREATE TABLE public.shop_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, date, time_slot)
);

-- Enable RLS for shop availability
ALTER TABLE public.shop_availability ENABLE ROW LEVEL SECURITY;

-- Public read access to availability
CREATE POLICY "Anyone can view shop availability" 
ON public.shop_availability 
FOR SELECT 
USING (true);

-- Create service pricing table
CREATE TABLE public.service_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  damage_type TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, service_type, damage_type)
);

-- Enable RLS for pricing
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;

-- Public read access to pricing
CREATE POLICY "Anyone can view service pricing" 
ON public.service_pricing 
FOR SELECT 
USING (true);

-- Create reviews table
CREATE TABLE public.shop_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  service_type TEXT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for reviews
ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;

-- Public read access to reviews
CREATE POLICY "Anyone can view reviews" 
ON public.shop_reviews 
FOR SELECT 
USING (true);

-- Anyone can create reviews
CREATE POLICY "Anyone can create reviews" 
ON public.shop_reviews 
FOR INSERT 
WITH CHECK (true);

-- Add triggers for timestamp updates
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shops_updated_at
BEFORE UPDATE ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_pricing_updated_at
BEFORE UPDATE ON public.service_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shop_reviews_updated_at
BEFORE UPDATE ON public.shop_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample shop data
INSERT INTO public.shops (id, name, address, city, postal_code, latitude, longitude, phone, rating, total_reviews, is_mobile_service, is_certified, business_hours) VALUES
('rgm', 'Royal Glass Masters', '123 Repair Street', 'London', 'SW1A 1AA', 51.5074, -0.1278, '+44 20 7946 0958', 4.8, 127, false, true, '{"monday": "08:00-18:00", "tuesday": "08:00-18:00", "wednesday": "08:00-18:00", "thursday": "08:00-18:00", "friday": "08:00-18:00", "saturday": "09:00-16:00", "sunday": "closed"}'),
('cgc', 'Crystal Glass Centre', '456 Auto Lane', 'Manchester', 'M1 1AA', 53.4808, -2.2426, '+44 161 123 4567', 4.6, 89, true, true, '{"monday": "07:30-19:00", "tuesday": "07:30-19:00", "wednesday": "07:30-19:00", "thursday": "07:30-19:00", "friday": "07:30-19:00", "saturday": "08:00-17:00", "sunday": "10:00-15:00"}'),
('glx', 'GlassLux Premium', '789 Premium Ave', 'Birmingham', 'B1 1AA', 52.4862, -1.8904, '+44 121 234 5678', 4.9, 203, false, true, '{"monday": "08:00-17:30", "tuesday": "08:00-17:30", "wednesday": "08:00-17:30", "thursday": "08:00-17:30", "friday": "08:00-17:30", "saturday": "09:00-15:00", "sunday": "closed"}'),
('dxc', 'DriveXpress Care', '321 Quick Fix Road', 'Leeds', 'LS1 1AA', 53.8008, -1.5491, '+44 113 345 6789', 4.4, 156, true, false, '{"monday": "06:00-20:00", "tuesday": "06:00-20:00", "wednesday": "06:00-20:00", "thursday": "06:00-20:00", "friday": "06:00-20:00", "saturday": "07:00-19:00", "sunday": "08:00-18:00"}'),
('ps1', 'Precision Specialists', '654 Expert Plaza', 'Bristol', 'BS1 1AA', 51.4545, -2.5879, '+44 117 456 7890', 4.7, 94, false, true, '{"monday": "08:30-17:00", "tuesday": "08:30-17:00", "wednesday": "08:30-17:00", "thursday": "08:30-17:00", "friday": "08:30-17:00", "saturday": "09:00-14:00", "sunday": "closed"}'),
('ps2', 'ProShield Auto Glass', '987 Shield Street', 'Liverpool', 'L1 1AA', 53.4084, -2.9916, '+44 151 567 8901', 4.5, 78, true, true, '{"monday": "07:00-18:00", "tuesday": "07:00-18:00", "wednesday": "07:00-18:00", "thursday": "07:00-18:00", "friday": "07:00-18:00", "saturday": "08:00-16:00", "sunday": "09:00-15:00"}');

-- Insert sample pricing data
INSERT INTO public.service_pricing (shop_id, service_type, damage_type, base_price, description, estimated_duration_minutes) VALUES
-- Royal Glass Masters pricing
('rgm', 'repair', 'chip', 45.00, 'Professional chip repair with premium resin', 30),
('rgm', 'repair', 'crack', 65.00, 'Crack repair up to 15cm', 45),
('rgm', 'replacement', 'windscreen', 280.00, 'OEM quality windscreen replacement', 120),
('rgm', 'replacement', 'side_window', 120.00, 'Side window replacement', 60),

-- Crystal Glass Centre pricing  
('cgc', 'repair', 'chip', 40.00, 'Mobile chip repair service', 25),
('cgc', 'repair', 'crack', 60.00, 'On-site crack repair', 40),
('cgc', 'replacement', 'windscreen', 260.00, 'Mobile windscreen replacement', 90),
('cgc', 'replacement', 'side_window', 110.00, 'Mobile side window replacement', 50),

-- GlassLux Premium pricing
('glx', 'repair', 'chip', 55.00, 'Premium chip repair with lifetime warranty', 35),
('glx', 'repair', 'crack', 75.00, 'Advanced crack repair technology', 50),
('glx', 'replacement', 'windscreen', 320.00, 'Premium OEM windscreen with advanced features', 150),
('glx', 'replacement', 'side_window', 140.00, 'Premium side window replacement', 75),

-- DriveXpress Care pricing
('dxc', 'repair', 'chip', 35.00, 'Quick chip repair', 20),
('dxc', 'repair', 'crack', 55.00, 'Fast crack repair service', 35),
('dxc', 'replacement', 'windscreen', 240.00, 'Standard windscreen replacement', 90),
('dxc', 'replacement', 'side_window', 100.00, 'Standard side window replacement', 45),

-- Precision Specialists pricing
('ps1', 'repair', 'chip', 50.00, 'Precision chip repair with quality guarantee', 40),
('ps1', 'repair', 'crack', 70.00, 'Expert crack repair service', 55),
('ps1', 'replacement', 'windscreen', 300.00, 'Specialist windscreen replacement', 135),
('ps1', 'replacement', 'side_window', 130.00, 'Precision side window fitting', 70),

-- ProShield Auto Glass pricing
('ps2', 'repair', 'chip', 42.00, 'Professional mobile chip repair', 30),
('ps2', 'repair', 'crack', 62.00, 'Mobile crack repair service', 45),
('ps2', 'replacement', 'windscreen', 270.00, 'Mobile windscreen replacement', 100),
('ps2', 'replacement', 'side_window', 115.00, 'Mobile side window service', 55);

-- Insert sample reviews
INSERT INTO public.shop_reviews (shop_id, customer_name, customer_email, rating, review_text, service_type) VALUES
('rgm', 'Sarah Johnson', 'sarah.j@email.com', 5, 'Excellent service! Fixed my chip perfectly and very professional.', 'repair'),
('rgm', 'Mike Thompson', 'mike.t@email.com', 5, 'Great windscreen replacement, high quality work.', 'replacement'),
('cgc', 'Emma Wilson', 'emma.w@email.com', 4, 'Good mobile service, came to my office. Quick and efficient.', 'repair'),
('cgc', 'David Brown', 'david.b@email.com', 5, 'Fantastic mobile service, saved me so much time!', 'replacement'),
('glx', 'Lisa Chen', 'lisa.c@email.com', 5, 'Premium service worth every penny. Perfect finish.', 'replacement'),
('glx', 'Tom Parker', 'tom.p@email.com', 5, 'Outstanding quality and customer service.', 'repair'),
('dxc', 'Jenny Smith', 'jenny.s@email.com', 4, 'Quick and affordable. Got the job done well.', 'repair'),
('dxc', 'Alex Turner', 'alex.t@email.com', 4, 'Good value for money, reliable service.', 'replacement'),
('ps1', 'Robert Davis', 'robert.d@email.com', 5, 'Specialists indeed! Perfect technical execution.', 'replacement'),
('ps1', 'Mary White', 'mary.w@email.com', 4, 'Very thorough and professional approach.', 'repair'),
('ps2', 'Chris Green', 'chris.g@email.com', 5, 'Excellent mobile service, very convenient.', 'repair'),
('ps2', 'Anna Taylor', 'anna.t@email.com', 4, 'Good service, competitive prices.', 'replacement');

-- Create function to update shop ratings
CREATE OR REPLACE FUNCTION update_shop_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.shops 
  SET 
    rating = (
      SELECT ROUND(AVG(rating::decimal), 2) 
      FROM public.shop_reviews 
      WHERE shop_id = NEW.shop_id
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.shop_reviews 
      WHERE shop_id = NEW.shop_id
    )
  WHERE id = NEW.shop_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update shop ratings
CREATE TRIGGER update_shop_rating_trigger
AFTER INSERT OR UPDATE OF rating ON public.shop_reviews
FOR EACH ROW
EXECUTE FUNCTION update_shop_rating();

-- Function to populate availability data
DO $$
BEGIN
  INSERT INTO public.shop_availability (shop_id, date, time_slot, is_available)
  SELECT 
    s.shop_id,
    d.date,
    t.time_slot,
    CASE WHEN random() < 0.2 THEN FALSE ELSE TRUE END as is_available
  FROM 
    (VALUES ('rgm'), ('cgc'), ('glx'), ('dxc'), ('ps1'), ('ps2')) AS s(shop_id),
    (SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '1 day')::date AS date) AS d,
    (VALUES 
      ('09:00'::time), ('09:30'::time), ('10:00'::time), ('10:30'::time), 
      ('11:00'::time), ('11:30'::time), ('13:00'::time), ('13:30'::time),
      ('14:00'::time), ('14:30'::time), ('15:00'::time), ('15:30'::time),
      ('16:00'::time), ('16:30'::time), ('17:00'::time), ('17:30'::time)
    ) AS t(time_slot)
  WHERE EXTRACT(DOW FROM d.date) NOT IN (0, 6); -- Exclude weekends
END $$;