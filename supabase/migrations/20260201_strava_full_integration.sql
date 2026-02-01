-- Migration: Strava Full Integration
-- Date: 2026-02-01
-- Description: Implements the database schema required for the Strava integration documentation.
-- Includes: Encrypted tokens, Device Connections, Workout Metrics, and RPCs.

-- 1. Enable pgcrypto for encryption
create extension if not exists "pgcrypto";

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- A. Device Connections (Track link status)
create table if not exists device_connections (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    platform text not null check (platform in ('strava', 'whoop', 'garmin')),
    provider_user_id text, -- The Platform's User ID (e.g. Strava Athlete ID)
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    
    unique(user_id, platform)
);

-- B. Strava Tokens (Encrypted Storage)
create table if not exists strava_tokens (
    user_id uuid references auth.users(id) on delete cascade primary key,
    access_token bytea not null,   -- Encrypted
    refresh_token bytea not null,  -- Encrypted
    expires_at timestamptz not null,
    refreshing_at timestamptz,     -- For distributed lock
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- C. OAuth States (CSRF Protection)
create table if not exists oauth_states (
    state text primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default now(),
    expires_at timestamp with time zone not null
);

-- D. Workout Metrics (Standardized Activity Data)
create table if not exists workout_metrics (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    source_platform text not null, -- 'strava', 'manual'
    external_id text,              -- Strava Activity ID
    
    -- Core Metrics
    title text,
    type text,                     -- 'Run', 'Ride', etc.
    start_time timestamptz not null,
    duration_seconds int,
    distance_meters float,
    calories float,
    average_heartrate float,
    max_heartrate float,
    elevation_gain_meters float,
    
    -- App Specific
    points int default 0,
    
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    
    unique(source_platform, external_id)
);

-- E. Cycle Metrics (Daily Aggregates - Placeholder for future use)
create table if not exists cycle_metrics (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    date date not null,
    
    total_strain float default 0,
    total_recovery float default 0,
    total_sleep_hours float default 0,
    total_calories float default 0,
    
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    
    unique(user_id, date)
);


-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

-- Enable RLS
alter table device_connections enable row level security;
alter table strava_tokens enable row level security;
alter table workout_metrics enable row level security;
alter table cycle_metrics enable row level security;

-- Device Connections: Users view/manage own
drop policy if exists "Users can view own connections" on device_connections;
create policy "Users can view own connections" on device_connections for select using (auth.uid() = user_id);

drop policy if exists "Users can update own connections" on device_connections;
create policy "Users can update own connections" on device_connections for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own connections" on device_connections;
create policy "Users can delete own connections" on device_connections for delete using (auth.uid() = user_id);

-- Strava Tokens: NO ACCESS for clients (only via RPC/Edge Functions)
-- However, if we want the user to be able to "disconnect" (delete) easily via client:
drop policy if exists "Users can delete own tokens" on strava_tokens;
create policy "Users can delete own tokens" on strava_tokens for delete using (auth.uid() = user_id);
-- Select/Update/Insert BLOCKED for direct client access intentionally.

-- Workout Metrics: Users view own (and maybe others for leaderboard? for now strictly own or public based on standard)
-- Let's make it similar to 'activities': Public read, Owner write.
drop policy if exists "Public read workout metrics" on workout_metrics;
create policy "Public read workout metrics" on workout_metrics for select using (true);

drop policy if exists "Users manage own workout metrics" on workout_metrics;
create policy "Users manage own workout metrics" on workout_metrics for all using (auth.uid() = user_id);

-- Cycle Metrics
drop policy if exists "Public read cycle metrics" on cycle_metrics;
create policy "Public read cycle metrics" on cycle_metrics for select using (true);

drop policy if exists "Users manage own cycle metrics" on cycle_metrics;
create policy "Users manage own cycle metrics" on cycle_metrics for all using (auth.uid() = user_id);


-- ============================================================================
-- 4. RPC FUNCTIONS (Secure Backend Logic)
-- ============================================================================

-- Function to SAVE tokens securely (Calling from Edge Function)
-- Must provide encryption key
create or replace function save_strava_tokens(
    p_user_id uuid,
    p_access_token text,
    p_refresh_token text,
    p_expires_at timestamptz,
    p_encryption_key text
)
returns void
security definer -- Runs as database owner (bypasses RLS) to write to strava_tokens
language plpgsql
as $$
begin
    insert into strava_tokens (user_id, access_token, refresh_token, expires_at)
    values (
        p_user_id,
        pgp_sym_encrypt(p_access_token, p_encryption_key),
        pgp_sym_encrypt(p_refresh_token, p_encryption_key),
        p_expires_at
    )
    on conflict (user_id) do update
    set 
        access_token = pgp_sym_encrypt(p_access_token, p_encryption_key),
        refresh_token = pgp_sym_encrypt(p_refresh_token, p_encryption_key),
        expires_at = p_expires_at,
        updated_at = now();
end;
$$;

-- Function to GET tokens (Calling from Edge Function)
create or replace function get_strava_tokens(
    p_user_id uuid,
    p_encryption_key text
)
returns table (access_token text, refresh_token text, expires_at timestamptz)
security definer
language plpgsql
as $$
begin
    return query
    select 
        pgp_sym_decrypt(st.access_token, p_encryption_key)::text,
        pgp_sym_decrypt(st.refresh_token, p_encryption_key)::text,
        st.expires_at
    from strava_tokens st
    where st.user_id = p_user_id;
end;
$$;

-- Function to Register/Update Connection Status
create or replace function update_device_connection(
    p_user_id uuid,
    p_platform text,
    p_provider_user_id text,
    p_is_active boolean
)
returns void
security definer
language plpgsql
as $$
begin
    insert into device_connections (user_id, platform, provider_user_id, is_active)
    values (p_user_id, p_platform, p_provider_user_id, p_is_active)
    on conflict (user_id, platform) do update
    set 
        provider_user_id = coalesce(p_provider_user_id, device_connections.provider_user_id),
        is_active = p_is_active,
        updated_at = now();
end;
$$;

-- ============================================================================
-- 5. MIGRATION FROM OLD 'user_secrets' (Best Effort)
-- ============================================================================
-- Note: 'user_secrets' stores plaintext. We need to encrypt it moving to 'strava_tokens'.
-- BUT we don't have the encryption key here in SQL easily unless hardcoded or passed.
-- For now, we will SKIP automatic data migration purely in SQL to avoiding exposing a hardcoded key in this file.
-- Users will likely need to Re-Authenticate to generate secure tokens.
-- We will just ensure old tables don't conflict.

