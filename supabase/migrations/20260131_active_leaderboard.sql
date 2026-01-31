-- Create Activities Table
create table activities (
  id text primary key, -- Using text to support Strava IDs
  user_id uuid references auth.users not null,
  type text not null,
  distance float not null, -- stored in meters (Strava standard)
  duration int not null, -- stored in seconds
  date timestamp with time zone not null,
  points int default 0,
  title text,
  
  external_id text,
  source text default 'manual', -- 'strava' or 'manual'
  
  created_at timestamp with time zone default now()
);

-- RLS
alter table activities enable row level security;

create policy "Users can view own activities"
  on activities for select
  using ( auth.uid() = user_id );

create policy "Users can insert own activities"
  on activities for insert
  with check ( auth.uid() = user_id );

-- Create Leaderboard View (Joining with Profiles)
create or replace view leaderboard as
  select 
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    coalesce(sum(a.points), 0) as total_points,
    count(a.id) as activity_count
  from profiles p
  left join activities a on p.id = a.user_id
  group by p.id, p.full_name, p.avatar_url
  order by total_points desc;
