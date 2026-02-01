-- Script to clear all participants AND RANKINGS
-- Usage: Run this in the Supabase Dashboard SQL Editor

BEGIN;

-- 1. Clear Leaderboards and Classifications (Event Specific)
TRUNCATE TABLE public.general_classification RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.mountain_classification RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.stage_results RESTART IDENTITY CASCADE;

-- 2. Clear Event Participants
-- This removes the link between users and events
TRUNCATE TABLE public.event_participants RESTART IDENTITY CASCADE;

-- 3. Clear GLOBAL Ranking Data
-- The leaderboard is calculated from workout_metrics (and legacy activities)
TRUNCATE TABLE public.workout_metrics RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.activities RESTART IDENTITY CASCADE;

-- 4. Reset Profile Stats (Balance & Total Points)
-- Since we cleared all activities, points should be 0.
UPDATE public.profiles
SET balance = 0,
    total_points_all_time = 0;

COMMIT;

-- Output confirmation
DO $$
BEGIN
    RAISE NOTICE 'All event participants, results, and GLOBAL RANKINGS have been cleared.';
END $$;
