-- Migration: Update Leaderboard and Add Office Support
-- Date: 2026-02-01
-- Description: Adds office column to profiles, updates leaderboard view to use workout_metrics, and creates office_leaderboard view.

-- 1. Add office column to profiles if it doesn't exist
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'office') then
        alter table profiles add column office text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'onboarding_completed') then
        alter table profiles add column onboarding_completed boolean default false;
    end if;
end $$;

-- 2. Update Leaderboard View to use workout_metrics
drop view if exists leaderboard;
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
  group by p.id, p.full_name, p.avatar_url, p.office
  order by total_points desc;

-- 3. Create Office Leaderboard View
create or replace view office_leaderboard as
  select 
    p.office,
    sum(wm.points) as total_points,
    count(distinct p.id) as member_count
  from profiles p
  join workout_metrics wm on p.id = wm.user_id
  where p.office is not null
  group by p.office
  order by total_points desc;
