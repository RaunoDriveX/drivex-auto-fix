-- Drop overly permissive RLS policy on insurer_users table
DROP POLICY IF EXISTS "System can manage insurer users" ON public.insurer_users;

-- Drop overly permissive storage policies
DROP POLICY IF EXISTS "System can manage invoice storage" ON storage.objects;
DROP POLICY IF EXISTS "System can manage completion proof storage" ON storage.objects;