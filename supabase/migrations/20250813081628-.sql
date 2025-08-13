-- Create insurance details table for post-booking data collection
CREATE TABLE public.insurance_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_reference TEXT NOT NULL,
  insurance_company_name TEXT NOT NULL,
  insurer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.insurance_details ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since this is for post-booking without auth)
CREATE POLICY "Anyone can insert insurance details" 
ON public.insurance_details 
FOR INSERT 
WITH CHECK (true);

-- Admin can view all insurance details
CREATE POLICY "Public read access to insurance details" 
ON public.insurance_details 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_insurance_details_updated_at
  BEFORE UPDATE ON public.insurance_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();