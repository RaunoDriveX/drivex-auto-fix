-- Fix security issues: insurer_users privilege escalation and insurance_details public access

-- 1. Remove the dangerous INSERT policy that allows privilege escalation
DROP POLICY IF EXISTS "Allow users to create their own insurer_user record" ON public.insurer_users;

-- 2. Fix insurance_details table - remove public read access, restrict to authenticated users
DROP POLICY IF EXISTS "Public read access to insurance details" ON public.insurance_details;

-- Create new policy: Only allow users to read their own insurance details
CREATE POLICY "Users can view their own insurance details" 
ON public.insurance_details 
FOR SELECT 
USING (
  customer_email = (auth.jwt() ->> 'email'::text)
);

-- 3. Restrict insurance_details insert to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert insurance details" ON public.insurance_details;

CREATE POLICY "Authenticated users can insert insurance details" 
ON public.insurance_details 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 4. Add NOT NULL constraint to created_by for future insurer_users records
-- (Can't alter existing NULL values, but enforce going forward)
-- Note: This is commented out to avoid breaking existing records
-- ALTER TABLE public.insurer_users ALTER COLUMN created_by SET NOT NULL;