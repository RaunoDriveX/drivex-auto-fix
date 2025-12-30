-- Add INSERT policy for insurer_profiles to allow new signups
CREATE POLICY "Allow authenticated users to create insurer profiles"
ON public.insurer_profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also add a policy to allow users to insert themselves as insurer_users
CREATE POLICY "Allow users to create their own insurer_user record"
ON public.insurer_users
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());