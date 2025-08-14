-- Create enums for service capabilities
CREATE TYPE public.service_capability AS ENUM ('repair_only', 'replacement_only', 'both');
CREATE TYPE public.repair_type AS ENUM ('chip_repair', 'crack_repair', 'both_repairs');
CREATE TYPE public.job_status AS ENUM ('pending', 'offered', 'accepted', 'declined', 'expired', 'completed');
CREATE TYPE public.notification_type AS ENUM ('job_offer', 'job_update', 'payment');

-- Update shops table with capability tracking
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS service_capability service_capability DEFAULT 'both',
ADD COLUMN IF NOT EXISTS repair_types repair_type DEFAULT 'both_repairs',
ADD COLUMN IF NOT EXISTS spare_parts_stock jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS average_lead_time_days integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS acceptance_rate numeric(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS response_time_minutes numeric(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS quality_score numeric(3,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS jobs_offered_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS jobs_accepted_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS jobs_declined_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_job_offered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS performance_tier text DEFAULT 'standard';

-- Create job offers table
CREATE TABLE IF NOT EXISTS public.job_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  shop_id text NOT NULL,
  offered_price numeric(10,2) NOT NULL,
  estimated_completion_time interval,
  status job_status DEFAULT 'offered',
  offered_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL,
  decline_reason text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.shop_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id text NOT NULL,
  notification_type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  read_at timestamp with time zone,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create windshield parts catalog
CREATE TABLE IF NOT EXISTS public.windshield_parts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  make text NOT NULL,
  model text NOT NULL,
  year_from integer NOT NULL,
  year_to integer NOT NULL,
  part_number text NOT NULL,
  description text,
  oem_price numeric(10,2),
  aftermarket_price numeric(10,2),
  availability_status text DEFAULT 'in_stock',
  lead_time_days integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.windshield_parts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job offers
CREATE POLICY "Shops can view their own job offers" 
ON public.job_offers 
FOR SELECT 
USING (true); -- For now, allow shops to see all offers

CREATE POLICY "System can manage job offers" 
ON public.job_offers 
FOR ALL 
USING (true);

-- Create RLS policies for notifications
CREATE POLICY "Shops can view their own notifications" 
ON public.shop_notifications 
FOR SELECT 
USING (true);

CREATE POLICY "System can create notifications" 
ON public.shop_notifications 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for parts catalog
CREATE POLICY "Anyone can view windshield parts" 
ON public.windshield_parts 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_offers_shop_id ON public.job_offers(shop_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_appointment_id ON public.job_offers(appointment_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_status ON public.job_offers(status);
CREATE INDEX IF NOT EXISTS idx_shop_notifications_shop_id ON public.shop_notifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_windshield_parts_lookup ON public.windshield_parts(make, model, year_from, year_to);

-- Create trigger for job offers updated_at
CREATE TRIGGER update_job_offers_updated_at
BEFORE UPDATE ON public.job_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample windshield parts data
INSERT INTO public.windshield_parts (make, model, year_from, year_to, part_number, description, oem_price, aftermarket_price, availability_status, lead_time_days) VALUES
('Toyota', 'Camry', 2018, 2023, 'TOY-CAM-18-23-WS', 'Front Windshield', 320.00, 180.00, 'in_stock', 1),
('BMW', '3 Series', 2019, 2024, 'BMW-3S-19-24-WS', 'Front Windshield with Rain Sensor', 580.00, 350.00, 'in_stock', 2),
('Mercedes-Benz', 'C-Class', 2020, 2024, 'MB-CC-20-24-WS', 'Front Windshield Premium', 650.00, 420.00, 'limited_stock', 3),
('Volkswagen', 'Golf', 2017, 2023, 'VW-GLF-17-23-WS', 'Front Windshield', 280.00, 160.00, 'in_stock', 1),
('Audi', 'A4', 2018, 2024, 'AUD-A4-18-24-WS', 'Front Windshield with HUD', 720.00, 480.00, 'limited_stock', 4);

-- Update shops with sample capability data
UPDATE public.shops 
SET 
  service_capability = CASE 
    WHEN id = 'rgm' THEN 'repair_only'::service_capability
    WHEN id = 'dxc' THEN 'both'::service_capability
    ELSE 'both'::service_capability
  END,
  repair_types = 'both_repairs'::repair_type,
  spare_parts_stock = '{"toyota_camry": 2, "bmw_3series": 1, "mercedes_c_class": 0}',
  average_lead_time_days = CASE 
    WHEN id = 'rgm' THEN 0  -- Mobile repair, no parts needed
    WHEN id = 'dxc' THEN 1  -- OEM center with good stock
    ELSE 2
  END,
  acceptance_rate = CASE 
    WHEN id = 'dxc' THEN 95.50
    WHEN id = 'cgc' THEN 87.20
    WHEN id = 'rgm' THEN 92.80
    ELSE 75.00
  END,
  response_time_minutes = CASE 
    WHEN id = 'rgm' THEN 8.50
    WHEN id = 'dxc' THEN 12.20
    WHEN id = 'cgc' THEN 15.80
    ELSE 25.00
  END,
  quality_score = CASE 
    WHEN id = 'dxc' THEN 4.90
    WHEN id = 'cgc' THEN 4.80
    WHEN id = 'rgm' THEN 4.60
    ELSE 4.20
  END,
  performance_tier = CASE 
    WHEN id = 'dxc' THEN 'premium'
    WHEN id = 'cgc' THEN 'premium'
    WHEN id = 'rgm' THEN 'premium'
    ELSE 'standard'
  END;