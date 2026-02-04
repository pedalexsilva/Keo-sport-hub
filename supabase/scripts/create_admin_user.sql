-- =============================================================================
-- SCRIPT: Create Admin User (admin@keo.com)
-- =============================================================================
-- ⚠️  Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================================

DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    existing_user_id uuid;
BEGIN
    -- Check if user already exists
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = 'admin@keo.com';
    
    IF existing_user_id IS NOT NULL THEN
        new_user_id := existing_user_id;
        RAISE NOTICE 'User already exists with ID: %', new_user_id;
    ELSE
        -- Insert into auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            role,
            aud,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            'admin@keo.com',
            crypt('adminsales', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            'authenticated',
            'authenticated',
            '',
            '',
            '',
            ''
        );
        RAISE NOTICE 'Created auth.users entry with ID: %', new_user_id;
    END IF;
    
    -- Upsert into profiles with admin flag
    INSERT INTO profiles (
        id,
        email,
        full_name,
        is_admin,
        updated_at
    ) VALUES (
        new_user_id,
        'admin@keo.com',
        'Admin KEO',
        true,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = 'admin@keo.com',
        full_name = 'Admin KEO',
        is_admin = true,
        updated_at = NOW();
    
    RAISE NOTICE '✅ Admin user ready!';
    RAISE NOTICE 'Email: admin@keo.com';
    RAISE NOTICE 'Password: adminsales';
    
END $$;

-- Verify the user
SELECT 
    u.id,
    u.email,
    p.full_name,
    p.is_admin
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@keo.com';
