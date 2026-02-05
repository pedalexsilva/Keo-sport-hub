-- Migration: Event Visibility and Access Control
-- Date: 2026-02-06
-- Description: Adds visibility controls (Public, Department, Private) and specific access lists.

-- 1. Add visibility columns to events table
alter table events 
add column if not exists visibility text check (visibility in ('public', 'department', 'private')) default 'public',
add column if not exists target_office text; -- Used if visibility = 'department'

-- 2. Create Event Access table (for Private events)
create table if not exists event_access (
    event_id uuid references events(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default now(),
    primary key (event_id, user_id)
);

-- Enable RLS
alter table event_access enable row level security;

-- 3. RLS Policies for Event Access

-- Creator can manage access list
drop policy if exists "Creator manages event access" on event_access;
create policy "Creator manages event access"
    on event_access
    for all
    using ( exists (select 1 from events where events.id = event_access.event_id and events.creator_id = auth.uid()) );

-- Users can see if they are on the list
drop policy if exists "Users read own access" on event_access;
create policy "Users read own access"
    on event_access
    for select
    using ( auth.uid() = user_id );

-- 4. Update Events RLS for Visibility logic

-- Drop existing "Events are viewable by everyone"
drop policy if exists "Events are viewable by everyone" on events;
drop policy if exists "Events Visibility Policy" on events;

-- Create comprehensive visibility policy
create policy "Events Visibility Policy"
    on events
    for select
    using (
        -- 1. Creator always sees own events
        auth.uid() = creator_id
        OR
        -- 2. Public events (viewable by everyone)
        visibility = 'public'
        OR
        -- 3. Department events (viewable if user.office matches target_office)
        (
            visibility = 'department' 
            AND 
            target_office = (select office from profiles where id = auth.uid())
        )
        OR
        -- 4. Private events (viewable if user is in event_access list)
        (
            visibility = 'private' 
            AND 
            exists (select 1 from event_access where event_access.event_id = events.id and event_access.user_id = auth.uid())
        )
    );

-- Index for performance
create index if not exists idx_events_visibility on events(visibility);
create index if not exists idx_event_access_user on event_access(user_id);
