-- Migration: Segment Finish Mode for Stages
-- Date: 2026-02-05
-- Description: Adds support for using a Strava segment as the stage finish line

-- ============================================================================
-- 1. NEW COLUMNS ON EVENT_STAGES
-- ============================================================================

-- finish_mode: 'activity' (default) = use full activity time
--              'segment' = use time from activity start to segment end
ALTER TABLE event_stages ADD COLUMN IF NOT EXISTS 
    finish_mode TEXT DEFAULT 'activity' 
    CHECK (finish_mode IN ('activity', 'segment'));

-- finish_segment_id: References the segment that serves as the finish line
-- Only used when finish_mode = 'segment'
ALTER TABLE event_stages ADD COLUMN IF NOT EXISTS 
    finish_segment_id UUID REFERENCES stage_segments(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. INDEX FOR FINISH SEGMENT LOOKUPS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_event_stages_finish_segment 
    ON event_stages(finish_segment_id) 
    WHERE finish_segment_id IS NOT NULL;

-- ============================================================================
-- 3. COMMENT FOR DOCUMENTATION
-- ============================================================================
COMMENT ON COLUMN event_stages.finish_mode IS 
    'How to calculate stage time: activity = full activity, segment = activity start to segment end';
COMMENT ON COLUMN event_stages.finish_segment_id IS 
    'When finish_mode=segment, references the stage_segments record used as finish line';
