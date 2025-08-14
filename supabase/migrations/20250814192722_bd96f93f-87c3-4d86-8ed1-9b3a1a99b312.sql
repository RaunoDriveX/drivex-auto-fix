-- Add photo storage capability to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS damage_photos TEXT[];
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Create storage bucket for damage photos
INSERT INTO storage.buckets (id, name, public) VALUES ('damage-photos', 'damage-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for damage photos
CREATE POLICY "Authenticated users can view damage photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'damage-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload damage photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'damage-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own damage photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'damage-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own damage photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'damage-photos' AND auth.uid() IS NOT NULL);