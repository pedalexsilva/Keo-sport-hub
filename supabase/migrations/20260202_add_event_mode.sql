-- Add 'mode' column to events table
-- Default to 'competitive' to maintain backward compatibility
-- 'social' events will not require stage creation 

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'mode') THEN
        ALTER TABLE public.events ADD COLUMN mode text DEFAULT 'competitive' NOT NULL;
        ALTER TABLE public.events ADD CONSTRAINT check_event_mode CHECK (mode IN ('competitive', 'social'));
    END IF;
END $$;
