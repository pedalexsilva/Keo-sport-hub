-- 1. Ensure 'is_admin' column exists in profiles
alter table profiles 
add column if not exists is_admin boolean default false;

-- 2. Ensure 'events' table has new columns
alter table events 
add column if not exists max_participants integer,
add column if not exists status text not null default 'open' check (status in ('open', 'closed', 'cancelled', 'completed')),
add column if not exists end_date timestamp with time zone;

-- 3. Update Events Policies to be ADMIN ONLY
-- First, enable RLS
alter table events enable row level security;

-- VIEW: Everyone can view events
drop policy if exists "Events are viewable by everyone" on events;
create policy "Events are viewable by everyone"
  on events for select
  using ( true );

-- INSERT: Only Admins can insert
drop policy if exists "Users can create events" on events;
create policy "Admins can create events"
  on events for insert
  with check ( 
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- UPDATE: Only Admins can update
drop policy if exists "Users can update events" on events;
create policy "Admins can update events"
  on events for update
  using ( 
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- DELETE: Only Admins can delete
drop policy if exists "Users can delete events" on events;
create policy "Admins can delete events"
  on events for delete
  using ( 
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- 4. Set the current user as Admin (OPTIONAL helper for development)
-- This creates a trigger to make the first user an admin, or you can manually update it.
-- For now, let's just allow you to manually update it in the dashboard.
