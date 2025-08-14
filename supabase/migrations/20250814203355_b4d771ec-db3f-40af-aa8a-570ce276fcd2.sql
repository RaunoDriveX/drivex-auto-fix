-- Create call center leads table
CREATE TABLE public.call_center_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  lead_source TEXT DEFAULT 'website',
  initial_message TEXT,
  priority_level INTEGER DEFAULT 5, -- 1 (high) to 10 (low)
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'qualified', 'converted', 'lost')),
  shop_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  must_contact_by TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 minutes'),
  vehicle_info JSONB DEFAULT '{}'::jsonb,
  damage_description TEXT,
  location_info JSONB DEFAULT '{}'::jsonb
);

-- Create call center activities table
CREATE TABLE public.call_center_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.call_center_leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call_attempt', 'call_success', 'voicemail', 'email_sent', 'sms_sent', 'note', 'inspection_scheduled')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  ai_agent_id TEXT,
  duration_seconds INTEGER,
  summary TEXT,
  transcript TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE
);

-- Create call center stats table
CREATE TABLE public.call_center_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  leads_received INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  average_response_time_minutes NUMERIC DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  calls_successful INTEGER DEFAULT 0,
  inspections_scheduled INTEGER DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, date)
);

-- Enable RLS
ALTER TABLE public.call_center_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_center_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_center_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for call_center_leads
CREATE POLICY "Shops can view their own leads" 
ON public.call_center_leads 
FOR SELECT 
USING (shop_id IN (
  SELECT shops.id FROM shops 
  WHERE shops.email = (auth.jwt() ->> 'email')
));

CREATE POLICY "Shops can manage their own leads" 
ON public.call_center_leads 
FOR ALL 
USING (shop_id IN (
  SELECT shops.id FROM shops 
  WHERE shops.email = (auth.jwt() ->> 'email')
));

CREATE POLICY "Anyone can create leads" 
ON public.call_center_leads 
FOR INSERT 
WITH CHECK (true);

-- Create policies for call_center_activities
CREATE POLICY "Shops can view activities for their leads" 
ON public.call_center_activities 
FOR SELECT 
USING (lead_id IN (
  SELECT call_center_leads.id FROM call_center_leads 
  WHERE call_center_leads.shop_id IN (
    SELECT shops.id FROM shops 
    WHERE shops.email = (auth.jwt() ->> 'email')
  )
));

CREATE POLICY "System can manage all activities" 
ON public.call_center_activities 
FOR ALL 
USING (true);

-- Create policies for call_center_stats
CREATE POLICY "Shops can view their own stats" 
ON public.call_center_stats 
FOR SELECT 
USING (shop_id IN (
  SELECT shops.id FROM shops 
  WHERE shops.email = (auth.jwt() ->> 'email')
));

CREATE POLICY "System can manage all stats" 
ON public.call_center_stats 
FOR ALL 
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_call_center_leads_updated_at
  BEFORE UPDATE ON public.call_center_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_call_center_stats_updated_at
  BEFORE UPDATE ON public.call_center_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();