-- Enable pgcrypto for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
BEGIN
  -- 1. Add 'role' column to profiles if it doesn't exist
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
  EXCEPTION
    WHEN duplicate_column THEN
      -- Column already exists, ignore
      NULL;
  END;

  -- 2. Check if the user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@keo.com';

  -- 3. If user does not exist, insert them
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@keo.com',
      crypt('adminsales', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin KEO"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- 4. Upsert into public.profiles
  -- Now safe to use 'role' column
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (v_user_id, 'Admin KEO', 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      full_name = 'Admin KEO';
      
END $$;
