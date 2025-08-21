-- Fix infinite recursion in insurer_users RLS policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Insurer users can view users in their organization" ON public.insurer_users;
DROP POLICY IF EXISTS "Insurer admins can manage users in their organization" ON public.insurer_users;

-- Create new policies using the security definer functions to avoid recursion
CREATE POLICY "Insurer users can view users in their organization" 
ON public.insurer_users 
FOR SELECT 
USING (
  insurer_id = public.get_user_insurer_id(auth.uid())
);

CREATE POLICY "Insurer admins can manage users in their organization" 
ON public.insurer_users 
FOR ALL
USING (
  insurer_id = public.get_user_insurer_id(auth.uid()) AND 
  public.is_insurer_admin(auth.uid())
);

-- Also add a policy for users to insert themselves (needed for user creation)
CREATE POLICY "Allow inserting users in same organization"
ON public.insurer_users
FOR INSERT
WITH CHECK (
  insurer_id = public.get_user_insurer_id(auth.uid()) AND
  public.is_insurer_admin(auth.uid())
);