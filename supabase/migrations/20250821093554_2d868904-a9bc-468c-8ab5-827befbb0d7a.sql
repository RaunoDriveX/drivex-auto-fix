-- Create insurer profile for Sieger Insurance
INSERT INTO public.insurer_profiles (insurer_name, email, contact_person, phone)
VALUES ('Sieger Insurance', 'rauno.sigur@gmail.com', 'Rauno Sigur', '+372 58528824');

-- Note: The auth user will need to be created through the authentication system
-- This migration just sets up the insurer profile structure