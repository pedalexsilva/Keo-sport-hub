-- Migration: Hide Admin from Leaderboards
-- Date: 2026-02-01
-- Description: Updates leaderboard views to strictly exclude users with role 'admin'.

-- 1. Update Leaderboard View
-- Exclude admins from the global user leaderboard
create or replace view leaderboard as
  select 
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    p.office,
    coalesce(sum(wm.points), 0) as total_points,
    count(wm.id) as activity_count
  from profiles p
  left join workout_metrics wm on p.id = wm.user_id
  where (p.role != 'admin' OR p.role IS NULL)
  group by p.id, p.full_name, p.avatar_url, p.office
  order by total_points desc;

-- 2. Update Office Leaderboard View
-- Exclude admins from contributing to office scores
create or replace view office_leaderboard as
  select 
    p.office,
    sum(wm.points) as total_points,
    count(distinct p.id) as member_count
  from profiles p
  join workout_metrics wm on p.id = wm.user_id
  where p.office is not null
  and (p.role != 'admin' OR p.role IS NULL)
  group by p.office
  order by total_points desc;
