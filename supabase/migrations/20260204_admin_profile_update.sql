-- Migration: Admin policy to update any profile
-- Date: 2026-02-04

-- Helper function is_admin() is already defined in 20260204_admin_strava_access.sql

drop policy if exists "Admins can update all profiles" on profiles;
create policy "Admins can update all profiles" 
  on profiles for update
  using (is_admin());
