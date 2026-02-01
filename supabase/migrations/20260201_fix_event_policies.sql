-- Add Update and Delete policies for Events
-- Currently only Insert and Select are defined.

-- Allow authenticated users to update events
drop policy if exists "Users can update events" on events;
create policy "Users can update events"
  on events for update
  using ( auth.role() = 'authenticated' );

-- Allow authenticated users to delete events
drop policy if exists "Users can delete events" on events;
create policy "Users can delete events"
  on events for delete
  using ( auth.role() = 'authenticated' );
