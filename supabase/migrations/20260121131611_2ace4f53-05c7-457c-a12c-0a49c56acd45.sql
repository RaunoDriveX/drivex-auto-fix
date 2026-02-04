-- Create insurer_shop_selections table for storing the 3 shops selected by insurer
CREATE TABLE public.insurer_shop_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  shop_id TEXT NOT NULL,
  distance_km NUMERIC,
  estimated_price NUMERIC,
  priority_order INTEGER NOT NULL CHECK (priority_order BETWEEN 1 AND 3),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(appointment_id, shop_id),
  UNIQUE(appointment_id, priority_order)
);

-- Create insurer_cost_estimates table for BOM and cost breakdown
CREATE TABLE public.insurer_cost_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  parts_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add new columns to appointments table for customer confirmations
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS customer_shop_selection TEXT,
ADD COLUMN IF NOT EXISTS customer_shop_selected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS customer_cost_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_cost_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS workflow_stage TEXT DEFAULT 'new';

-- Enable RLS on new tables
ALTER TABLE public.insurer_shop_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurer_cost_estimates ENABLE ROW LEVEL SECURITY;

-- RLS policies for insurer_shop_selections
CREATE POLICY "Insurers can manage shop selections for their appointments"
ON public.insurer_shop_selections
FOR ALL
USING (
  appointment_id IN (
    SELECT a.id FROM appointments a
    JOIN insurer_profiles ip ON ip.insurer_name = a.insurer_name
    WHERE ip.email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Anyone can view shop selections by tracking token"
ON public.insurer_shop_selections
FOR SELECT
USING (
  appointment_id IN (
    SELECT id FROM appointments WHERE tracking_token IS NOT NULL
  )
);

-- RLS policies for insurer_cost_estimates
CREATE POLICY "Insurers can manage cost estimates for their appointments"
ON public.insurer_cost_estimates
FOR ALL
USING (
  appointment_id IN (
    SELECT a.id FROM appointments a
    JOIN insurer_profiles ip ON ip.insurer_name = a.insurer_name
    WHERE ip.email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Anyone can view cost estimates by tracking token"
ON public.insurer_cost_estimates
FOR SELECT
USING (
  appointment_id IN (
    SELECT id FROM appointments WHERE tracking_token IS NOT NULL
  )
);

-- Create trigger for updated_at on insurer_cost_estimates
CREATE TRIGGER update_insurer_cost_estimates_updated_at
BEFORE UPDATE ON public.insurer_cost_estimates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();