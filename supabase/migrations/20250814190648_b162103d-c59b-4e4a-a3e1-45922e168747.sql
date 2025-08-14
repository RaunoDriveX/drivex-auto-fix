-- Create storage bucket for shop logos
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-logos', 'shop-logos', true);

-- Create RLS policies for shop logos
CREATE POLICY "Anyone can view shop logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'shop-logos');

CREATE POLICY "Authenticated users can upload their own shop logo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'shop-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

CREATE POLICY "Shop owners can update their own logo" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'shop-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

CREATE POLICY "Shop owners can delete their own logo" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'shop-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

-- Add logo_url column to shops table
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS logo_url TEXT;