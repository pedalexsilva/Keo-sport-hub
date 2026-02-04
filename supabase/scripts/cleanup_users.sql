-- =============================================================================
-- SCRIPT: Remove all users except João Sales (joao.lucio.sales@gmail.com)
-- =============================================================================
-- ⚠️  WARNING: This is a DESTRUCTIVE operation!
--     Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
--     Make sure to backup your data before executing!
-- =============================================================================

DO $$
DECLARE
    keep_user_id uuid;
BEGIN
    -- Find the user ID for João Sales
    SELECT id INTO keep_user_id 
    FROM auth.users 
    WHERE email = 'joao.lucio.sales@gmail.com';
    
    IF keep_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email joao.lucio.sales@gmail.com not found!';
    END IF;
    
    RAISE NOTICE 'Keeping user: % (joao.lucio.sales@gmail.com)', keep_user_id;
    
    -- =========================================================================
    -- STEP 1: Clean up event-related data first (due to FK constraints)
    -- =========================================================================
    
    -- Stage results
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stage_results') THEN
        DELETE FROM stage_results;
        RAISE NOTICE 'Cleaned stage_results';
    END IF;
    
    -- General classification
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'general_classification') THEN
        DELETE FROM general_classification;
        RAISE NOTICE 'Cleaned general_classification';
    END IF;
    
    -- Mountain classification
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mountain_classification') THEN
        DELETE FROM mountain_classification;
        RAISE NOTICE 'Cleaned mountain_classification';
    END IF;
    
    -- Stage segments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stage_segments') THEN
        DELETE FROM stage_segments;
        RAISE NOTICE 'Cleaned stage_segments';
    END IF;
    
    -- Event stages
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_stages') THEN
        DELETE FROM event_stages;
        RAISE NOTICE 'Cleaned event_stages';
    END IF;
    
    -- Event participants
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_participants') THEN
        DELETE FROM event_participants;
        RAISE NOTICE 'Cleaned event_participants';
    END IF;
    
    -- Events (delete all, João can recreate if needed)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        DELETE FROM events;
        RAISE NOTICE 'Cleaned events';
    END IF;
    
    -- =========================================================================
    -- STEP 2: Clean up user-related data (for users to be removed)
    -- =========================================================================
    
    -- Workout metrics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workout_metrics') THEN
        DELETE FROM workout_metrics WHERE user_id != keep_user_id;
        RAISE NOTICE 'Cleaned workout_metrics';
    END IF;
    
    -- Device connections
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_connections') THEN
        DELETE FROM device_connections WHERE user_id != keep_user_id;
        RAISE NOTICE 'Cleaned device_connections';
    END IF;
    
    -- Strava tokens
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'strava_tokens') THEN
        DELETE FROM strava_tokens WHERE user_id != keep_user_id;
        RAISE NOTICE 'Cleaned strava_tokens';
    END IF;
    
    -- Activities
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activities') THEN
        DELETE FROM activities WHERE user_id != keep_user_id;
        RAISE NOTICE 'Cleaned activities';
    END IF;
    
    -- Cycle metrics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cycle_metrics') THEN
        DELETE FROM cycle_metrics WHERE user_id != keep_user_id;
        RAISE NOTICE 'Cleaned cycle_metrics';
    END IF;
    
    -- OAuth states
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'oauth_states') THEN
        DELETE FROM oauth_states WHERE user_id != keep_user_id;
        RAISE NOTICE 'Cleaned oauth_states';
    END IF;
    
    -- Orders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        DELETE FROM orders WHERE user_id != keep_user_id;
        RAISE NOTICE 'Cleaned orders';
    END IF;
    
    -- Tickets
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
        DELETE FROM tickets WHERE user_id != keep_user_id;
        RAISE NOTICE 'Cleaned tickets';
    END IF;
    
    -- User inventory
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_inventory') THEN
        DELETE FROM user_inventory WHERE user_id != keep_user_id;
        RAISE NOTICE 'Cleaned user_inventory';
    END IF;
    
    -- Followers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'followers') THEN
        DELETE FROM followers WHERE follower_id != keep_user_id AND following_id != keep_user_id;
        RAISE NOTICE 'Cleaned followers';
    END IF;
    
    -- User secrets (uses 'id' column)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_secrets') THEN
        DELETE FROM user_secrets WHERE id != keep_user_id;
        RAISE NOTICE 'Cleaned user_secrets';
    END IF;
    
    -- =========================================================================
    -- STEP 3: Delete profiles and auth.users
    -- =========================================================================
    
    DELETE FROM profiles WHERE id != keep_user_id;
    RAISE NOTICE 'Cleaned profiles table';
    
    DELETE FROM auth.users WHERE id != keep_user_id;
    RAISE NOTICE 'Cleaned auth.users table';
    
    RAISE NOTICE '✅ Cleanup complete! Only user João Sales remains.';
    
END $$;

-- Verify the result
SELECT 
    u.id,
    u.email,
    p.full_name,
    p.is_admin
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;
