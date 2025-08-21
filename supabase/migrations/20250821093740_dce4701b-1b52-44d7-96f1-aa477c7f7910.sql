-- Create test user directly in auth.users table
-- Note: This is a special case for testing purposes
DO $$
DECLARE
  user_uuid uuid;
  insurer_uuid uuid;
BEGIN
  -- Generate a UUID for the new user
  user_uuid := gen_random_uuid();
  
  -- Get the insurer profile ID
  SELECT id INTO insurer_uuid FROM public.insurer_profiles WHERE insurer_name = 'Sieger Insurance';
  
  -- Insert into auth.users (this simulates what would normally be done through the auth API)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rauno.sigur@gmail.com',
    crypt('Lehe54', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Rauno Sigur"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    user_uuid::text,
    user_uuid,
    jsonb_build_object(
      'sub', user_uuid::text,
      'email', 'rauno.sigur@gmail.com'
    ),
    'email',
    now(),
    now(),
    now()
  );

  -- Now create the insurer user record
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

  RAISE NOTICE 'Successfully created test insurer user: rauno.sigur@gmail.com';
END $$;