-- Migration: Secure Strava Tokens
-- Date: 2026-02-01
-- Objective: Move sensitive tokens from public 'profiles' table to private 'user_secrets' table.

-- 1. Create user_secrets table
create table if not exists user_secrets (
  id uuid references auth.users not null primary key,
  strava_access_token text,
  strava_refresh_token text,
  strava_expires_at bigint,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Enable RLS
alter table user_secrets enable row level security;

-- 3. RLS Policies (STRICT)
-- Only the user can see their own secrets
drop policy if exists "Users can view own secrets" on user_secrets;
create policy "Users can view own secrets"
  on user_secrets for select
  using ( auth.uid() = id );

-- Only the user can update their own secrets
drop policy if exists "Users can update own secrets" on user_secrets;
create policy "Users can update own secrets"
  on user_secrets for update
  using ( auth.uid() = id );

-- Only the user can insert their own secrets
drop policy if exists "Users can insert own secrets" on user_secrets;
create policy "Users can insert own secrets"
  on user_secrets for insert
  with check ( auth.uid() = id );

-- 4. Migrate existing data (Best Effort)
-- Note: This assumes the script is run by a superuser or service role.
-- If running from client, this part might fail if RLS prevents selecting all profiles.
-- ideally run this via Supabase Dashboard SQL Editor.
insert into user_secrets (id, strava_access_token, strava_refresh_token, strava_expires_at)
select id, strava_access_token, strava_refresh_token, strava_expires_at
from profiles
where strava_access_token is not null
on conflict (id) do nothing;

-- 5. Clean up profiles table
-- We use a safe approach: update to null first, then user can manually drop columns later if desired.
-- OR we alter table to drop columns immediately. Given this is a "fix", let's drop.
alter table profiles drop column if exists strava_access_token;
alter table profiles drop column if exists strava_refresh_token;
alter table profiles drop column if exists strava_expires_at;
