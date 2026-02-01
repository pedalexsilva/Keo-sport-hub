-- Improve Events Table
alter table events 
add column if not exists max_participants integer,
add column if not exists status text not null default 'open' check (status in ('open', 'closed', 'cancelled', 'completed')),
add column if not exists end_date timestamp with time zone;

-- Update existing events to have status 'open' if null (though default handles new ones)
update events set status = 'open' where status is null;
