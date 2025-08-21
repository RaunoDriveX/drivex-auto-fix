-- Create job status enum
CREATE TYPE public.job_status_type AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Add job status tracking to appointments
ALTER TABLE public.appointments 
ADD COLUMN job_status public.job_status_type DEFAULT 'scheduled',
ADD COLUMN job_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN job_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN estimated_completion TIMESTAMP WITH TIME ZONE;

-- Create job status audit log table
CREATE TABLE public.job_status_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  job_offer_id UUID REFERENCES public.job_offers(id) ON DELETE SET NULL,
  claim_id TEXT,
  old_status public.job_status_type,
  new_status public.job_status_type NOT NULL,
  status_changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by_shop_id TEXT REFERENCES public.shops(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  webhook_sent_at TIMESTAMP WITH TIME ZONE,
  webhook_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook configurations table for insurers
CREATE TABLE public.insurer_webhook_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurer_id UUID NOT NULL REFERENCES public.insurer_profiles(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  events_subscribed TEXT[] DEFAULT ARRAY['status_change', 'job_completed'],
  retry_attempts INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_failure_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on new tables
ALTER TABLE public.job_status_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurer_webhook_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies for job status audit
CREATE POLICY "Insurers can view audit logs for their claims" 
ON public.job_status_audit 
FOR SELECT 
USING (
  appointment_id IN (
    SELECT a.id FROM public.appointments a
    JOIN public.insurer_profiles ip ON ip.insurer_name = a.insurer_name
    WHERE ip.email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Shops can view audit logs for their jobs" 
ON public.job_status_audit 
FOR SELECT 
USING (
  changed_by_shop_id IN (
    SELECT id FROM public.shops 
    WHERE email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "System can manage all audit logs" 
ON public.job_status_audit 
FOR ALL 
USING (true);

-- RLS policies for webhook configs
CREATE POLICY "Insurers can manage their webhook configs" 
ON public.insurer_webhook_configs 
FOR ALL 
USING (
  insurer_id IN (
    SELECT id FROM public.insurer_profiles 
    WHERE email = (auth.jwt() ->> 'email')
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_insurer_webhook_configs_updated_at
BEFORE UPDATE ON public.insurer_webhook_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_job_status_audit_appointment_id ON public.job_status_audit(appointment_id);
CREATE INDEX idx_job_status_audit_status_changed_at ON public.job_status_audit(status_changed_at DESC);
CREATE INDEX idx_job_status_audit_new_status ON public.job_status_audit(new_status);
CREATE INDEX idx_appointments_job_status ON public.appointments(job_status);
CREATE INDEX idx_appointments_insurer_name_status ON public.appointments(insurer_name, job_status);

-- Enable realtime for appointments table
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Enable realtime for job status audit table  
ALTER TABLE public.job_status_audit REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_status_audit;