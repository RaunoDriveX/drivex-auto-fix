-- Create appointments table
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

-- Enable RLS
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

-- Create shop availability table
CREATE TABLE public.shop_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL,
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

-- Create trigger for updating timestamps
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mock availability data for the next 30 days
INSERT INTO public.shop_availability (shop_id, date, time_slot, is_available)
SELECT 
  shop_id,
  generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '1 day')::date AS date,
  time_slot,
  CASE 
    -- Make some slots unavailable to simulate real bookings
    WHEN RANDOM() < 0.2 THEN FALSE 
    ELSE TRUE 
  END AS is_available
FROM 
  (VALUES ('rgm'), ('cgc'), ('glx'), ('dxc'), ('ps1'), ('ps2')) AS shops(shop_id),
  (VALUES 
    ('09:00'::time), ('09:30'::time), ('10:00'::time), ('10:30'::time), 
    ('11:00'::time), ('11:30'::time), ('13:00'::time), ('13:30'::time),
    ('14:00'::time), ('14:30'::time), ('15:00'::time), ('15:30'::time),
    ('16:00'::time), ('16:30'::time), ('17:00'::time), ('17:30'::time)
  ) AS times(time_slot)
WHERE 
  -- Don't create slots for weekends or outside business hours
  EXTRACT(DOW FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '1 day')) NOT IN (0, 6);