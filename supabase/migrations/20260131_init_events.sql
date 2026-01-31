-- Create Events Table
create table events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  date timestamp with time zone not null,
  location text,
  type text not null, -- 'Run', 'Ride', etc.
  image_url text,
  creator_id uuid references auth.users not null,
  created_at timestamp with time zone default now()
);

-- Event Participants (Many-to-Many)
create table event_participants (
  event_id uuid references events on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamp with time zone default now(),
  primary key (event_id, user_id)
);

-- RLS
alter table events enable row level security;
alter table event_participants enable row level security;

-- Events are viewable by everyone
create policy "Events are viewable by everyone"
  on events for select
  using ( true );

-- Authenticated users can create events
create policy "Users can create events"
  on events for insert
  with check ( auth.uid() = creator_id );

-- Participants are viewable by everyone
create policy "Participants are viewable by everyone"
  on event_participants for select
  using ( true );

-- Users can join (insert themselves)
create policy "Users can join events"
  on event_participants for insert
  with check ( auth.uid() = user_id );

-- Users can leave (delete themselves)
create policy "Users can leave events"
  on event_participants for delete
  using ( auth.uid() = user_id );
