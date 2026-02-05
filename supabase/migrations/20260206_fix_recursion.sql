-- FIX: Break infinite RLS recursion between events and event_access tables

-- 1. Create a secure function to check event ownership without triggering RLS
create or replace function is_event_creator(_event_id uuid)
returns boolean as $$
begin
  -- This runs with security definer privileges, bypassing RLS on the events table
  return exists (
    select 1 from events 
    where id = _event_id 
    and creator_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 2. Drop the problematic policy
drop policy if exists "Creator manages event access" on event_access;

-- 3. Re-create the policy using the secure function
create policy "Creator manages event access"
    on event_access
    for all
    using ( is_event_creator(event_id) );
