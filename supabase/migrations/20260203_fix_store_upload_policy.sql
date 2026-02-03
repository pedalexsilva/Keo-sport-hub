-- Fix storage policy for store-products to be more permissible (authenticated users)
-- This avoids issues where the 'admin' role check fails due to RLS recursion or missing data

-- Drop existing strict policies
drop policy if exists "Admins can upload store images" on storage.objects;
drop policy if exists "Admins can update store images" on storage.objects;
drop policy if exists "Admins can delete store images" on storage.objects;

-- Create new permissible policies for Authenticated users
-- (Mirroring the 'event-media' bucket setup which works)

create policy "Authenticated users can upload store images"
on storage.objects for insert
with check ( 
    bucket_id = 'store-products' 
    and auth.role() = 'authenticated' 
);

create policy "Authenticated users can update store images"
on storage.objects for update
using ( 
    bucket_id = 'store-products' 
    and auth.role() = 'authenticated' 
);

create policy "Authenticated users can delete store images"
on storage.objects for delete
using ( 
    bucket_id = 'store-products' 
    and auth.role() = 'authenticated' 
);

-- Ensure public read access is still there (it was named "Public Read Access")
-- No need to drop/recreate if it relies only on bucket_id, but checking purely for safety
-- drop policy if exists "Public Read Access" on storage.objects;
-- create policy "Public Read Access" ... 
-- (Leaving read access as is since it was fine)
