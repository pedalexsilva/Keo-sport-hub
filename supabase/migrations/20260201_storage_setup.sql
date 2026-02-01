-- Create storage bucket for event media
insert into storage.buckets (id, name, public)
values ('event-media', 'event-media', true)
on conflict (id) do nothing;

-- Policy: Public Read Access
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'event-media' );

-- Policy: Admin Write Access (Authenticated users can upload)
-- Ideally this should be restricted to admins, but for now we trust authenticated users or check app metadata
drop policy if exists "Authenticated users can upload" on storage.objects;
create policy "Authenticated users can upload"
on storage.objects for insert
with check ( bucket_id = 'event-media' and auth.role() = 'authenticated' );

-- Policy: Admin Update/Delete Access
drop policy if exists "Authenticated users can update" on storage.objects;
create policy "Authenticated users can update"
on storage.objects for update
using ( bucket_id = 'event-media' and auth.role() = 'authenticated' );

drop policy if exists "Authenticated users can delete" on storage.objects;
create policy "Authenticated users can delete"
on storage.objects for delete
using ( bucket_id = 'event-media' and auth.role() = 'authenticated' );
