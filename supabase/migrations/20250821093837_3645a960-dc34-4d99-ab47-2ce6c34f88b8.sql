-- Link the existing user to Sieger Insurance
DO $$
DECLARE
  user_uuid uuid;
  insurer_uuid uuid;
BEGIN
  -- Get the existing user ID
  SELECT id INTO user_uuid FROM auth.users WHERE email = 'rauno.sigur@gmail.com';
  
  -- Get the insurer profile ID
  SELECT id INTO insurer_uuid FROM public.insurer_profiles WHERE insurer_name = 'Sieger Insurance';
  
  -- Create the insurer user record
  INSERT INTO public.insurer_users (
    insurer_id,
    user_id,
    email,
    full_name,
    role,
    created_by
  ) VALUES (
    insurer_uuid,
    user_uuid,
    'rauno.sigur@gmail.com',
    'Rauno Sigur',
    'admin',
    user_uuid
  );

  RAISE NOTICE 'Successfully linked user rauno.sigur@gmail.com to Sieger Insurance as admin';
END $$;