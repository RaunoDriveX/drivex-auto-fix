-- Create insurer profiles table
CREATE TABLE public.insurer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurer_name TEXT NOT NULL UNIQUE,
  email TEXT,
  contact_person TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create preferred shops junction table
CREATE TABLE public.insurer_preferred_shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurer_id UUID NOT NULL REFERENCES public.insurer_profiles(id) ON DELETE CASCADE,
  shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  priority_level INTEGER DEFAULT 1, -- 1 = highest priority
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(insurer_id, shop_id)
);

-- Add insurer preference tracking to appointments
ALTER TABLE public.appointments 
ADD COLUMN insurer_name TEXT,
ADD COLUMN is_preferred_shop BOOLEAN DEFAULT false,
ADD COLUMN is_out_of_network BOOLEAN DEFAULT false;

-- Add insurer preference tracking to job offers
ALTER TABLE public.job_offers 
ADD COLUMN is_preferred_shop BOOLEAN DEFAULT false,
ADD COLUMN is_out_of_network BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.insurer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurer_preferred_shops ENABLE ROW LEVEL SECURITY;

-- RLS policies for insurer profiles
CREATE POLICY "Insurers can view their own profile" 
ON public.insurer_profiles 
FOR SELECT 
USING (email = (auth.jwt() ->> 'email'));

CREATE POLICY "Insurers can update their own profile" 
ON public.insurer_profiles 
FOR UPDATE 
USING (email = (auth.jwt() ->> 'email'));

CREATE POLICY "System can manage insurer profiles" 
ON public.insurer_profiles 
FOR ALL 
USING (true);

-- RLS policies for preferred shops
CREATE POLICY "Insurers can manage their preferred shops" 
ON public.insurer_preferred_shops 
FOR ALL 
USING (insurer_id IN (
  SELECT id FROM public.insurer_profiles 
  WHERE email = (auth.jwt() ->> 'email')
));

CREATE POLICY "Anyone can view preferred shops for routing" 
ON public.insurer_preferred_shops 
FOR SELECT 
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_insurer_profiles_updated_at
BEFORE UPDATE ON public.insurer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_insurer_preferred_shops_insurer_id ON public.insurer_preferred_shops(insurer_id);
CREATE INDEX idx_insurer_preferred_shops_shop_id ON public.insurer_preferred_shops(shop_id);
CREATE INDEX idx_insurer_preferred_shops_active ON public.insurer_preferred_shops(is_active, priority_level);
CREATE INDEX idx_appointments_insurer_name ON public.appointments(insurer_name);
CREATE INDEX idx_job_offers_preferred_shop ON public.job_offers(is_preferred_shop, is_out_of_network);