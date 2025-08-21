-- Create table for storing submitted insurance claims
CREATE TABLE public.insurance_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id),
  claim_number TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  insurer_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Damage information from AI analysis
  damage_type TEXT NOT NULL,
  damage_severity TEXT NOT NULL,
  damage_location TEXT NOT NULL,
  ai_confidence_score NUMERIC DEFAULT 0.85,
  ai_assessment_details JSONB DEFAULT '{}'::jsonb,
  
  -- Claim packet data
  damage_photos TEXT[], -- URLs to photos
  estimated_cost_min NUMERIC,
  estimated_cost_max NUMERIC,
  recommended_action TEXT NOT NULL, -- 'repair' or 'replacement'
  
  -- Submission details
  submission_method TEXT NOT NULL DEFAULT 'api', -- 'api' or 'email'
  submission_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'failed'
  submitted_at TIMESTAMP WITH TIME ZONE,
  api_response JSONB,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Insurer response
  insurer_response JSONB,
  claim_status TEXT DEFAULT 'submitted', -- 'submitted', 'approved', 'rejected', 'pending_review'
  insurer_decision_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own claims" 
ON public.insurance_claims 
FOR SELECT 
USING (customer_email = (auth.jwt() ->> 'email'::text));

CREATE POLICY "Users can create their own claims" 
ON public.insurance_claims 
FOR INSERT 
WITH CHECK (customer_email = (auth.jwt() ->> 'email'::text));

CREATE POLICY "System can manage all claims" 
ON public.insurance_claims 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_insurance_claims_updated_at
BEFORE UPDATE ON public.insurance_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_insurance_claims_appointment_id ON public.insurance_claims(appointment_id);
CREATE INDEX idx_insurance_claims_customer_email ON public.insurance_claims(customer_email);
CREATE INDEX idx_insurance_claims_claim_number ON public.insurance_claims(claim_number);
CREATE INDEX idx_insurance_claims_submission_status ON public.insurance_claims(submission_status);