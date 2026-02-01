-- ==========================================
-- FIX ALL ACCESS & STORAGE (Comprehensive)
-- ==========================================

-- 1. STORAGE: CMS Media Bucket
-- Ensure the bucket exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cms-media', 'cms-media', true, 52428800, '{image/*,video/*}')
on conflict (id) do update set
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = '{image/*,video/*}';

-- Storage Policies (Drop first to avoid conflicts)
drop policy if exists "Public Access CMS" on storage.objects;
drop policy if exists "Authenticated users can upload CMS" on storage.objects;
drop policy if exists "Authenticated users can update CMS" on storage.objects;
drop policy if exists "Authenticated users can delete CMS" on storage.objects;

-- Re-create Storage Policies
create policy "Public Access CMS" on storage.objects for select using ( bucket_id = 'cms-media' );
create policy "Authenticated users can upload CMS" on storage.objects for insert with check ( bucket_id = 'cms-media' and auth.role() = 'authenticated' );
create policy "Authenticated users can update CMS" on storage.objects for update using ( bucket_id = 'cms-media' and auth.role() = 'authenticated' );
create policy "Authenticated users can delete CMS" on storage.objects for delete using ( bucket_id = 'cms-media' and auth.role() = 'authenticated' );


-- 2. TABLE: CMS Config
create table if not exists public.cms_config (
    key text primary key,
    value jsonb not null,
    updated_at timestamp with time zone default now(),
    updated_by uuid references auth.users(id)
);
alter table public.cms_config enable row level security;

-- CMS Policies
drop policy if exists "Public can view cms config" on public.cms_config;
drop policy if exists "Admins can update cms config" on public.cms_config;
drop policy if exists "Authenticated can update cms config" on public.cms_config; -- Clean up potential old naming

-- Permissive policies for this stage of development:
create policy "Public can view cms config" on public.cms_config for select using (true);
-- Allow ANY authenticated user to update config (simplifies 'admin' role check issues)
create policy "Authenticated can update cms config" on public.cms_config for all using (auth.role() = 'authenticated');


-- 3. TABLE: Notifications
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    message text not null,
    type text default 'info',
    target_audience text default 'all',
    target_id text,
    created_at timestamp with time zone default now(),
    expires_at timestamp with time zone
);
alter table public.notifications enable row level security;

-- Notifications Policies
drop policy if exists "Users can view relevant notifications" on public.notifications;
drop policy if exists "Admins can manage notifications" on public.notifications;
drop policy if exists "Authenticated can manage notifications" on public.notifications;

create policy "Users can view relevant notifications" on public.notifications for select using (true); 
-- Allow ANY authenticated user to manage notifications
create policy "Authenticated can manage notifications" on public.notifications for all using (auth.role() = 'authenticated');
