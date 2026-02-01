-- Add calories column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS calories float;
