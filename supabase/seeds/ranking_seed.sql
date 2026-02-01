-- Seeding script for Ranking verification
-- 1. Updates profiles with random offices
-- 2. Inserts some workout metrics for points

-- Assign offices to random users
update profiles 
set office = (array['Porto', 'Lisboa'])[floor(random() * 2 + 1)]
where office is null;

-- Ensure current user has an office (for "Tu" display)
update profiles 
set office = 'Porto' 
where id = auth.uid();

-- Insert dummy workout metrics if none exist (safe insert)
insert into workout_metrics (user_id, source_platform, title, type, start_time, duration_seconds, distance_meters, calories, points, external_id)
select 
    id, 
    'manual', 
    'Test Run ' || left(md5(random()::text), 5), 
    'Run', 
    now(), 
    1800, 
    5000, 
    300, 
    floor(random() * 100)::int,
    'test_' || id || '_' || floor(random()*1000)::text
from profiles
limit 5
on conflict do nothing;
