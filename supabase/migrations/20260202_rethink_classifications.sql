-- Migration: Rethink Classifications (Human-in-the-Loop)
-- Date: 2026-02-02
-- Description: Updates stage_results for approval workflow and optimizes leaderboard calculation.

-- 1. Update stage_results table
do $$
begin
    -- Add status column
    if not exists (select 1 from information_schema.columns where table_name = 'stage_results' and column_name = 'status') then
        alter table stage_results add column status text check (status in ('pending', 'official', 'dq')) default 'pending';
    end if;

    -- Add official metrics columns (for manual overrides)
    if not exists (select 1 from information_schema.columns where table_name = 'stage_results' and column_name = 'official_time_seconds') then
        alter table stage_results add column official_time_seconds int;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'stage_results' and column_name = 'official_mountain_points') then
        alter table stage_results add column official_mountain_points int;
    end if;
end $$;


-- 2. Optimized Leaderboard Calculation (Set-Based)
create or replace function update_event_leaderboard(p_event_id uuid)
returns void
language plpgsql
security definer
as $$
begin
    -- A. General Classification (GC)
    -- 1. Clear existing GC for this event
    delete from general_classification where event_id = p_event_id;

    -- 2. Recalculate and Insert
    insert into general_classification (event_id, user_id, total_time_seconds, rank, gap_seconds)
    with user_totals as (
        select 
            sr.user_id,
            sum(coalesce(sr.official_time_seconds, sr.elapsed_time_seconds)) as total_time -- Prefer official, fallback to elapsed
        from stage_results sr
        join event_stages es on es.id = sr.stage_id
        where es.event_id = p_event_id
        and sr.status = 'official' -- ONLY count official results
        and sr.is_dnf = false
        group by sr.user_id
    ),
    ranked_totals as (
        select 
            user_id,
            total_time,
            rank() over (order by total_time asc) as rnk,
            first_value(total_time) over (order by total_time asc) as leader_time
        from user_totals
    )
    select 
        p_event_id,
        user_id,
        total_time,
        rnk,
        (total_time - leader_time) as gap
    from ranked_totals;

    -- B. Mountain Classification
    -- 1. Clear existing
    delete from mountain_classification where event_id = p_event_id;

    -- 2. Recalculate
    insert into mountain_classification (event_id, user_id, total_points, rank)
    with user_points as (
        select 
            sr.user_id,
            sum(coalesce(sr.official_mountain_points, sr.mountain_points)) as total_pts
        from stage_results sr
        join event_stages es on es.id = sr.stage_id
        where es.event_id = p_event_id
        and sr.status = 'official'
        group by sr.user_id
    )
    select 
        p_event_id,
        user_id,
        total_pts,
        rank() over (order by total_pts desc) as rnk
    from user_points;

end;
$$;
