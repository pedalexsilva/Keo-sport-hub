-- Migration: Fix Leaderboard Foreign Keys
-- Date: 2026-02-02
-- Description: Updates stage_results and classification tables to reference public.profiles instead of auth.users.
-- This allows PostgREST to properly join these tables with profiles in frontend queries.

-- 1. General Classification
ALTER TABLE general_classification
DROP CONSTRAINT general_classification_user_id_fkey;

ALTER TABLE general_classification
ADD CONSTRAINT general_classification_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Mountain Classification
ALTER TABLE mountain_classification
DROP CONSTRAINT mountain_classification_user_id_fkey;

ALTER TABLE mountain_classification
ADD CONSTRAINT mountain_classification_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Stage Results (Optional but recommended for consistency)
ALTER TABLE stage_results
DROP CONSTRAINT stage_results_user_id_fkey;

ALTER TABLE stage_results
ADD CONSTRAINT stage_results_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
