-- Function to close expired events
create or replace function public.close_expired_events()
returns void
language plpgsql
security definer
as $$
begin
  update events
  set status = 'closed'
  where status = 'open'
  and date < now();
end;
$$;

-- Grant execute permission
grant execute on function public.close_expired_events() to postgres;
grant execute on function public.close_expired_events() to service_role;
grant execute on function public.close_expired_events() to authenticated; -- Allow manual trigger if needed

-- Attempt to schedule with pg_cron
-- Note: This requires the pg_cron extension to be enabled in the Supabase Dashboard.
-- We try to create it, but it might fail permissions if not superuser.
-- The user might need to enable it manually in the dashboard -> Database -> Extensions.

do $$
begin
  if exists (
    select 1 from pg_available_extensions where name = 'pg_cron'
  ) then
    create extension if not exists pg_cron;
    
    -- Schedule job to run every 30 minutes
    -- Check if job exists to avoid duplicate logic if relying on job name (pg_cron < 1.4 doesn't support "create or replace schedule" easily with names sometimes)
    -- We'll just schedule it. un-schedule first to be safe.
    perform cron.unschedule('close_expired_events_job');
    perform cron.schedule('close_expired_events_job', '*/30 * * * *', 'select public.close_expired_events()');
  end if;
exception when others then
  -- If pg_cron fails (e.g. permission denied), we just ignore the cron part
  -- The function is still created and can be called via Client or bespoke Automation
  raise notice 'pg_cron could not be configured automatically. Please enable it in dashboard.';
end;
$$;
