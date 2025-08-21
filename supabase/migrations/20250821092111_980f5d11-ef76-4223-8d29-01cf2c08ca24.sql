-- Create storage buckets for invoices and completion proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('completion-proofs', 'completion-proofs', false);

-- Add invoice and proof tracking columns to appointments
ALTER TABLE public.appointments 
ADD COLUMN invoice_file_path TEXT,
ADD COLUMN completion_proof_path TEXT,
ADD COLUMN invoice_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN completion_proof_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN invoice_sent_to_insurer_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN completion_documents_verified BOOLEAN DEFAULT false;

-- Create invoice and completion tracking table
CREATE TABLE public.job_completion_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  shop_id TEXT NOT NULL REFERENCES public.shops(id),
  invoice_file_path TEXT NOT NULL,
  invoice_file_name TEXT NOT NULL,
  invoice_file_size INTEGER,
  completion_proof_path TEXT NOT NULL,
  completion_proof_file_name TEXT NOT NULL,
  completion_proof_file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_to_insurer_at TIMESTAMP WITH TIME ZONE,
  insurer_delivery_method TEXT, -- 'api' or 'email'
  insurer_delivery_status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  insurer_delivery_response JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE public.job_completion_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for job completion documents
CREATE POLICY "Shops can view their completion documents" 
ON public.job_completion_documents 
FOR SELECT 
USING (shop_id IN (
  SELECT id FROM public.shops 
  WHERE email = (auth.jwt() ->> 'email')
));

CREATE POLICY "Shops can create their completion documents" 
ON public.job_completion_documents 
FOR INSERT 
WITH CHECK (shop_id IN (
  SELECT id FROM public.shops 
  WHERE email = (auth.jwt() ->> 'email')
));

CREATE POLICY "Insurers can view completion documents for their claims" 
ON public.job_completion_documents 
FOR SELECT 
USING (
  appointment_id IN (
    SELECT a.id FROM public.appointments a
    JOIN public.insurer_profiles ip ON ip.insurer_name = a.insurer_name
    WHERE ip.email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "System can manage all completion documents" 
ON public.job_completion_documents 
FOR ALL 
USING (true);

-- Storage policies for invoices bucket
CREATE POLICY "Shops can upload invoices for their jobs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' AND
  auth.uid() IN (
    SELECT auth.uid() FROM public.shops 
    WHERE email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Shops can view their own invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices' AND
  auth.uid() IN (
    SELECT auth.uid() FROM public.shops 
    WHERE email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Insurers can view invoices for their claims"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices' AND
  name IN (
    SELECT jcd.invoice_file_path 
    FROM public.job_completion_documents jcd
    JOIN public.appointments a ON a.id = jcd.appointment_id
    JOIN public.insurer_profiles ip ON ip.insurer_name = a.insurer_name
    WHERE ip.email = (auth.jwt() ->> 'email')
  )
);

-- Storage policies for completion-proofs bucket
CREATE POLICY "Shops can upload completion proofs for their jobs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'completion-proofs' AND
  auth.uid() IN (
    SELECT auth.uid() FROM public.shops 
    WHERE email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Shops can view their own completion proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'completion-proofs' AND
  auth.uid() IN (
    SELECT auth.uid() FROM public.shops 
    WHERE email = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Insurers can view completion proofs for their claims"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'completion-proofs' AND
  name IN (
    SELECT jcd.completion_proof_path 
    FROM public.job_completion_documents jcd
    JOIN public.appointments a ON a.id = jcd.appointment_id
    JOIN public.insurer_profiles ip ON ip.insurer_name = a.insurer_name
    WHERE ip.email = (auth.jwt() ->> 'email')
  )
);

-- System can manage all storage objects
CREATE POLICY "System can manage invoice storage"
ON storage.objects
FOR ALL
USING (bucket_id = 'invoices');

CREATE POLICY "System can manage completion proof storage"
ON storage.objects
FOR ALL
USING (bucket_id = 'completion-proofs');

-- Add trigger for updated_at
CREATE TRIGGER update_job_completion_documents_updated_at
BEFORE UPDATE ON public.job_completion_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_job_completion_documents_appointment_id ON public.job_completion_documents(appointment_id);
CREATE INDEX idx_job_completion_documents_shop_id ON public.job_completion_documents(shop_id);
CREATE INDEX idx_job_completion_documents_status ON public.job_completion_documents(insurer_delivery_status);
CREATE INDEX idx_appointments_completion_documents ON public.appointments(completion_documents_verified);

-- Enable realtime for job completion documents
ALTER TABLE public.job_completion_documents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_completion_documents;