-- Copy the content of the migration here for manual execution if needed
-- This file serves as a quick way to run the SQL via Supabase dashboard or SQL editor

DO $$
BEGIN
    -- 1. Create table if it doesn't exist (minimal base)
    CREATE TABLE IF NOT EXISTS public.notifications (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at timestamp with time zone DEFAULT now(),
        title text NOT NULL,
        message text NOT NULL,
        type text DEFAULT 'info'
    );

    -- 2. Add columns safely

    -- user_id (Required for Strava Integration)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        ALTER TABLE public.notifications ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- read (Required for UI state)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
        ALTER TABLE public.notifications ADD COLUMN read boolean DEFAULT false;
    END IF;

    -- metadata (Required for Deep Links)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
        ALTER TABLE public.notifications ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- target_audience (Legacy CMS support)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'target_audience') THEN
        ALTER TABLE public.notifications ADD COLUMN target_audience text DEFAULT 'all';
    END IF;

    -- target_id (Legacy CMS support)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'target_id') THEN
        ALTER TABLE public.notifications ADD COLUMN target_id text;
    END IF;

END $$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view relevant notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (
        (user_id = auth.uid()) OR 
        (target_audience = 'user' AND target_id = auth.uid()::text) OR
        (target_audience = 'all')
    );

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
