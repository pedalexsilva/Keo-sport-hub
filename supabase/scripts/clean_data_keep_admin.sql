-- Script to clean all data and users, keeping only the Admin
-- Usage: Run this in the Supabase Dashboard SQL Editor

DO $$
DECLARE
    v_admin_email text := 'admin@keo.com';
    v_admin_id uuid;
    v_count integer;
BEGIN
    -- 1. Identify the Admin User
    SELECT id INTO v_admin_id
    FROM auth.users
    WHERE email = v_admin_email;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Admin user with email % not found. Aborting cleanup.', v_admin_email;
    END IF;

    RAISE NOTICE 'Admin ID found: %', v_admin_id;

    -- 2. Delete data dependent on Profiles (that must be deleted before Profiles)
    
    -- Delete Support Tickets (FK to profiles)
    DELETE FROM public.tickets
    WHERE user_id != v_admin_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % support tickets.', v_count;

    -- Delete Orders (FK to profiles)
    DELETE FROM public.orders
    WHERE user_id != v_admin_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % orders.', v_count;

    -- 3. Delete data dependent on Auth.Users (that use RESTRICT/NO ACTION or miss CASCADE)
    
    -- Delete Events created by non-admins
    DELETE FROM public.events
    WHERE creator_id != v_admin_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % events created by non-admins.', v_count;
    
    -- Delete Activities (FK to auth.users, NO CASCADE in original setup)
    DELETE FROM public.activities
    WHERE user_id != v_admin_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % activities.', v_count;

    -- Delete User Secrets (FK to auth.users, NO CASCADE)
    DELETE FROM public.user_secrets
    WHERE id != v_admin_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_secrets.', v_count;

    -- Handle CMS Config (FK updated_by references auth.users NO ACTION)
    -- We set updated_by to NULL for users we are about to delete
    UPDATE public.cms_config
    SET updated_by = NULL
    WHERE updated_by != v_admin_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Updated % cms_config entries to remove user references.', v_count;

    -- 4. Delete Profiles (must be done before deleting users usually to be clean, though FK is on Profile side)
    DELETE FROM public.profiles
    WHERE id != v_admin_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % profiles.', v_count;

    -- 5. Delete other user specific data manually if needed (safe measure)
    DELETE FROM public.notifications
    WHERE target_audience = 'user' 
    AND target_id != v_admin_id::text;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % notifications.', v_count;

    -- 6. Delete Users from Auth (Triggering Cascades)
    -- This should auto-delete:
    --   - device_connections (CASCADE)
    --   - strava_tokens (CASCADE)
    --   - oauth_states (CASCADE)
    --   - workout_metrics (CASCADE)
    --   - cycle_metrics (CASCADE)
    --   - stage_results (CASCADE)
    --   - general_classification (CASCADE)
    --   - mountain_classification (CASCADE)
    --   - event_participants (CASCADE)
    DELETE FROM auth.users
    WHERE id != v_admin_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % users.', v_count;

    RAISE NOTICE 'Cleanup complete. System reset to Admin only.';

END $$;
