-- Add email column to profiles
alter table public.profiles 
add column if not exists email text;

-- Function to handle new user creation including email
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Function to sync updates (e.g. if email changes)
create or replace function public.handle_user_update()
returns trigger as $$
begin
  update public.profiles
  set email = new.email,
      updated_at = now()
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for updates
drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_user_update();

-- Backfill existing emails (Try/Catch approach not needed in migration file usually, but best effort)
-- Note: This update might fail if run from client without service_role depending on RLS, 
-- but it serves as the logic intended.
-- Ideally user runs this query in Supabase SQL Editor to backfill.
-- update public.profiles p
-- set email = u.email
-- from auth.users u
-- where p.id = u.id and p.email is null;
