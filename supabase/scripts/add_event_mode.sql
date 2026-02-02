-- Run this mainly if the migration fails or to apply manually

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'mode') THEN
        ALTER TABLE public.events ADD COLUMN mode text DEFAULT 'competitive' NOT NULL;
        ALTER TABLE public.events ADD CONSTRAINT check_event_mode CHECK (mode IN ('competitive', 'social'));
    END IF;
END $$;
