-- Migration: Performance Indexes
-- Date: 2026-02-01
-- Objective: Add indexes to improve query performance for common access patterns.

-- 1. Activities: Filtering by user and sorting by date (Feed)
create index if not exists idx_activities_user_date 
on activities (user_id, date desc);

-- 2. Activities: Leaderboard calculation (Summing points)
-- Helpful if we ever query activities directly for points, though the view does grouping.
create index if not exists idx_activities_points 
on activities (points desc);

-- 3. Event Participants: Checking participation status
create index if not exists idx_participants_event_user 
on event_participants (event_id, user_id);

-- 4. Profiles: Search by username (if needed later)
create index if not exists idx_profiles_username 
on profiles (username);
