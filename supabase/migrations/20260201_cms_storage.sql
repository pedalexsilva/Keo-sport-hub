-- Create storage bucket for CMS media
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cms-media', 'cms-media', true, 52428800, '{image/*,video/*}') -- 50MB limit
on conflict (id) do update set
    file_size_limit = 52428800,
    allowed_mime_types = '{image/*,video/*}';

-- Policy: Public Read Access
drop policy if exists "Public Access CMS" on storage.objects;
create policy "Public Access CMS"
on storage.objects for select
using ( bucket_id = 'cms-media' );

-- Policy: Authenticated users can upload (Ideally restrict to admins)
drop policy if exists "Authenticated users can upload CMS" on storage.objects;
create policy "Authenticated users can upload CMS"
on storage.objects for insert
with check ( bucket_id = 'cms-media' and auth.role() = 'authenticated' );

-- Policy: Users can update
drop policy if exists "Authenticated users can update CMS" on storage.objects;
create policy "Authenticated users can update CMS"
on storage.objects for update
using ( bucket_id = 'cms-media' and auth.role() = 'authenticated' );

-- Policy: Users can delete
drop policy if exists "Authenticated users can delete CMS" on storage.objects;
create policy "Authenticated users can delete CMS"
on storage.objects for delete
using ( bucket_id = 'cms-media' and auth.role() = 'authenticated' );
