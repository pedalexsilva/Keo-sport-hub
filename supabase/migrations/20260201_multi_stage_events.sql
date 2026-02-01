-- Migration: Multi-Stage Events
-- Date: 2026-02-01
-- Description: Adds tables for managing multi-stage cycling events, including stages, results, and classifications.

-- 1. Event Stages
create table if not exists event_stages (
    id uuid default gen_random_uuid() primary key,
    event_id uuid references events(id) on delete cascade not null,
    name text not null, -- e.g., "Stage 1: Road Race"
    description text,
    image_url text, -- Stage cover image
    date date not null,
    stage_order int not null, -- 1, 2, 3...
    
    -- Configuration for Mountain Classification
    mountain_segment_ids text[], -- Array of Strava Segment IDs relevant for this stage
    segment_points_map jsonb, -- Map { "segment_id": points } (Optional override, or we use defaults)
    
    created_at timestamp with time zone default now(),
    
    unique(event_id, stage_order)
);

-- 2. Stage Results (Individual Rider Performance in a Stage)
create table if not exists stage_results (
    id uuid default gen_random_uuid() primary key,
    stage_id uuid references event_stages(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    
    strava_activity_id text, -- Link to source activity
    
    -- Metrics for Classifications
    elapsed_time_seconds int, -- For GC (NULL if DNF)
    mountain_points int default 0, -- For Mountain Classification
    
    is_dnf boolean default false, -- Did Not Finish
    
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    
    unique(stage_id, user_id)
);

-- 3. General Classification (GC) Leaderboard
create table if not exists general_classification (
    id uuid default gen_random_uuid() primary key,
    event_id uuid references events(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    
    total_time_seconds int not null,
    rank int, -- Cached rank
    gap_seconds int, -- Time behind leader
    
    updated_at timestamp with time zone default now(),
    
    unique(event_id, user_id)
);

-- 4. Mountain Classification Leaderboard
create table if not exists mountain_classification (
    id uuid default gen_random_uuid() primary key,
    event_id uuid references events(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    
    total_points int default 0,
    rank int, -- Cached rank
    
    updated_at timestamp with time zone default now(),
    
    unique(event_id, user_id)
);

-- RLS Policies

-- Enable RLS
alter table event_stages enable row level security;
alter table stage_results enable row level security;
alter table general_classification enable row level security;
alter table mountain_classification enable row level security;

-- Ensure image_url column exists (if table was already created before this change)
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name = 'event_stages' and column_name = 'image_url') then
        alter table event_stages add column image_url text;
    end if; 
end $$;

-- Drop existing policies to ensure idempotency
drop policy if exists "Public read event stages" on event_stages;
drop policy if exists "Creators manage event stages" on event_stages;

drop policy if exists "Public read stage results" on stage_results;
drop policy if exists "Creators manage stage results" on stage_results;

drop policy if exists "Public read GC" on general_classification;
drop policy if exists "Public read Mountain" on mountain_classification;
drop policy if exists "Creators manage GC" on general_classification;
drop policy if exists "Creators manage Mountain" on mountain_classification;

-- Event Stages: Public Read, Creator Write
create policy "Public read event stages" on event_stages for select using (true);
create policy "Creators manage event stages" on event_stages for all using (
    exists (select 1 from events where events.id = event_stages.event_id and events.creator_id = auth.uid())
);

-- Stage Results: Public Read, Creator Write (Admin/System usually writes this via Edge Function, but Creator needs access too)
create policy "Public read stage results" on stage_results for select using (true);
-- Allow creators to manually edit results if needed
create policy "Creators manage stage results" on stage_results for all using (
    exists (
        select 1 from event_stages 
        join events on events.id = event_stages.event_id 
        where event_stages.id = stage_results.stage_id and events.creator_id = auth.uid()
    )
);

-- Classifications: Public Read
create policy "Public read GC" on general_classification for select using (true);
create policy "Public read Mountain" on mountain_classification for select using (true);
-- Write access usually via System/Edge Function, but we allow Creator to fix if needed
create policy "Creators manage GC" on general_classification for all using (
    exists (select 1 from events where events.id = general_classification.event_id and events.creator_id = auth.uid())
);
create policy "Creators manage Mountain" on mountain_classification for all using (
    exists (select 1 from events where events.id = mountain_classification.event_id and events.creator_id = auth.uid())
);
