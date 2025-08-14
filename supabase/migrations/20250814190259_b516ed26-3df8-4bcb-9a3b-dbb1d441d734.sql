-- Allow shops to create and manage their own records
DROP POLICY IF EXISTS "Anyone can view shops" ON public.shops;
DROP POLICY IF EXISTS "Shops can manage their own data" ON public.shops;

-- Create new policies for shop self-management
CREATE POLICY "Anyone can view shops" 
ON public.shops 
FOR SELECT 
USING (true);

CREATE POLICY "Shops can insert their own record" 
ON public.shops 
FOR INSERT 
WITH CHECK (email = (auth.jwt() ->> 'email'));

CREATE POLICY "Shops can update their own record" 
ON public.shops 
FOR UPDATE 
USING (email = (auth.jwt() ->> 'email'));

-- Allow shops to manage their own service pricing
DROP POLICY IF EXISTS "Anyone can view service pricing" ON public.service_pricing;

CREATE POLICY "Anyone can view service pricing" 
ON public.service_pricing 
FOR SELECT 
USING (true);

CREATE POLICY "Shops can manage their own pricing" 
ON public.service_pricing 
FOR ALL 
USING (shop_id IN (SELECT id FROM public.shops WHERE email = (auth.jwt() ->> 'email')));

-- Allow shops to manage their own availability
DROP POLICY IF EXISTS "Anyone can view shop availability" ON public.shop_availability;

CREATE POLICY "Anyone can view shop availability" 
ON public.shop_availability 
FOR SELECT 
USING (true);

CREATE POLICY "Shops can manage their own availability" 
ON public.shop_availability 
FOR ALL 
USING (shop_id IN (SELECT id FROM public.shops WHERE email = (auth.jwt() ->> 'email')));