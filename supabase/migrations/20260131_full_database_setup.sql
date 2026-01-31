-- MASTER MIGRATION SCRIPT: KEO SPORTS HUB
-- Run this single script to initialize the entire database schema safely.

-- ============================================================================
-- 1. PROFILES & AUTH
-- ============================================================================

-- Create a table for public profiles
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  
  -- Strava Tokens
  strava_access_token text,
  strava_refresh_token text,
  strava_expires_at bigint,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger logic needs to handle if trigger already exists (Postgres doesn't support generic CREATE OR REPLACE TRIGGER)
-- We drop it first to be safe
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================================
-- 2. EVENTS SYSTEM
-- ============================================================================

-- Create Events Table
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  date timestamp with time zone not null,
  location text,
  type text not null, -- 'Run', 'Ride', etc.
  image_url text,
  creator_id uuid references auth.users not null,
  created_at timestamp with time zone default now()
);

-- Event Participants (Many-to-Many)
create table if not exists event_participants (
  event_id uuid references events on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamp with time zone default now(),
  primary key (event_id, user_id)
);

-- RLS
alter table events enable row level security;
alter table event_participants enable row level security;

-- Events are viewable by everyone
drop policy if exists "Events are viewable by everyone" on events;
create policy "Events are viewable by everyone"
  on events for select
  using ( true );

-- Authenticated users can create events
drop policy if exists "Users can create events" on events;
create policy "Users can create events"
  on events for insert
  with check ( auth.uid() = creator_id );

-- Participants are viewable by everyone
drop policy if exists "Participants are viewable by everyone" on event_participants;
create policy "Participants are viewable by everyone"
  on event_participants for select
  using ( true );

-- Users can join (insert themselves)
drop policy if exists "Users can join events" on event_participants;
create policy "Users can join events"
  on event_participants for insert
  with check ( auth.uid() = user_id );

-- Users can leave (delete themselves)
drop policy if exists "Users can leave events" on event_participants;
create policy "Users can leave events"
  on event_participants for delete
  using ( auth.uid() = user_id );


-- ============================================================================
-- 3. LEADERBOARD & ACTIVITIES
-- ============================================================================

-- Create Activities Table
create table if not exists activities (
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

drop policy if exists "Activities are viewable by everyone" on activities;
create policy "Activities are viewable by everyone"
  on activities for select
  using ( true );

drop policy if exists "Users can insert own activities" on activities;
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
