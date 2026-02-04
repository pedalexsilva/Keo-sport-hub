-- Migration: Admin access to view Strava connection status
-- Date: 2026-02-04
-- Description: Allows admin users to see which users have Strava connected

-- ============================================================================
-- 1. Ensure admin user has the correct role and flag
-- ============================================================================
UPDATE profiles 
SET role = 'admin', is_admin = true 
WHERE email = 'admin@keo.com';

-- ============================================================================
-- 2. Create helper function to check if user is admin
-- ============================================================================

-- First, create a helper function to check if user is admin
create or replace function is_admin()
returns boolean
security definer
language plpgsql
as $$
begin
    return exists (
        select 1 from profiles 
        where id = auth.uid() 
        and role = 'admin'
    );
end;
$$;

-- Add SELECT policy for admins on strava_tokens
drop policy if exists "Admins can view all token connections" on strava_tokens;
create policy "Admins can view all token connections" on strava_tokens 
    for select 
    using (is_admin());

-- ============================================================================
-- 2. Alternative: Use device_connections table (already has public read)
-- But it may not be populated for all strava users.
-- Let's also ensure admins can read device_connections
-- ============================================================================

drop policy if exists "Admins can view all device connections" on device_connections;
create policy "Admins can view all device connections" on device_connections 
    for select 
    using (is_admin());

-- ============================================================================
-- 3. Grant execute on the is_admin function
-- ============================================================================
grant execute on function is_admin() to authenticated;
