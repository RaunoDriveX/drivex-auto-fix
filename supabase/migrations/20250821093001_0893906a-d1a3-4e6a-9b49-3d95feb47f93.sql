-- Create insurer user roles enum
CREATE TYPE public.insurer_user_role AS ENUM ('admin', 'claims_user');

-- Create insurer users table for multi-user support
CREATE TABLE public.insurer_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurer_id UUID NOT NULL REFERENCES public.insurer_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role public.insurer_user_role NOT NULL DEFAULT 'claims_user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(insurer_id, user_id)
);

-- Enable RLS on insurer users table
ALTER TABLE public.insurer_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for insurer users
CREATE POLICY "Insurer users can view users in their organization" 
ON public.insurer_users 
FOR SELECT 
USING (
  insurer_id IN (
    SELECT iu.insurer_id FROM public.insurer_users iu
    WHERE iu.user_id = auth.uid()
  )
);

CREATE POLICY "Insurer admins can manage users in their organization" 
ON public.insurer_users 
FOR ALL
USING (
  insurer_id IN (
    SELECT iu.insurer_id FROM public.insurer_users iu
    WHERE iu.user_id = auth.uid() AND iu.role = 'admin' AND iu.is_active = true
  )
);

CREATE POLICY "System can manage insurer users" 
ON public.insurer_users 
FOR ALL 
USING (true);

-- Create function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_insurer_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.insurer_users
    WHERE user_id = _user_id
      AND role = 'admin'
      AND is_active = true
  )
$$;

-- Create function to get user's insurer organization
CREATE OR REPLACE FUNCTION public.get_user_insurer_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT insurer_id
  FROM public.insurer_users
  WHERE user_id = _user_id
    AND is_active = true
  LIMIT 1
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_insurer_users_updated_at
BEFORE UPDATE ON public.insurer_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_insurer_users_insurer_id ON public.insurer_users(insurer_id);
CREATE INDEX idx_insurer_users_user_id ON public.insurer_users(user_id);
CREATE INDEX idx_insurer_users_role ON public.insurer_users(role);
CREATE INDEX idx_insurer_users_active ON public.insurer_users(is_active);

-- Enable realtime for insurer users
ALTER TABLE public.insurer_users REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.insurer_users;