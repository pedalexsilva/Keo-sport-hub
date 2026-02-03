-- Migration: Stage Segments for Multi-Segment Scoring
-- Date: 2026-02-03
-- Description: Adds tables for managing multiple scorable segments per stage (KOM Classification)

-- ============================================================================
-- 1. STAGE SEGMENTS TABLE
-- ============================================================================
-- Each stage can have multiple segments (climbs) with individual scoring
CREATE TABLE IF NOT EXISTS stage_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id UUID REFERENCES event_stages(id) ON DELETE CASCADE NOT NULL,
    
    -- Strava Integration
    strava_segment_id TEXT NOT NULL,
    
    -- Segment Metadata
    name TEXT NOT NULL,                     -- e.g., "Jebel Hafeet (ascent 1)"
    distance_meters NUMERIC,                -- e.g., 12100 (12.1 km)
    avg_grade_percent NUMERIC,              -- e.g., 6.3
    
    -- Category & Scoring
    category TEXT CHECK (category IN ('hc', 'cat1', 'cat2', 'cat3', 'cat4')) DEFAULT 'cat4',
    points_scale INTEGER[] DEFAULT ARRAY[15, 12, 10, 8],  -- Points for 1st, 2nd, 3rd, 4th place
    
    -- Ordering
    segment_order INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(stage_id, strava_segment_id)
);

-- ============================================================================
-- 2. SEGMENT RESULTS TABLE
-- ============================================================================
-- Individual rider performance on each segment
CREATE TABLE IF NOT EXISTS segment_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id UUID REFERENCES event_stages(id) ON DELETE CASCADE NOT NULL,
    segment_id UUID REFERENCES stage_segments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Strava Data
    strava_effort_id TEXT,
    
    -- Performance Metrics
    elapsed_time_seconds INTEGER NOT NULL,
    
    -- Calculated Fields (populated after all results are synced)
    position INTEGER,                       -- 1st, 2nd, 3rd...
    points_earned INTEGER DEFAULT 0,
    
    -- Status for Race Control workflow
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'official', 'dq')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(segment_id, user_id)
);

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE stage_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotency)
DROP POLICY IF EXISTS "Public read stage segments" ON stage_segments;
DROP POLICY IF EXISTS "Creators manage stage segments" ON stage_segments;
DROP POLICY IF EXISTS "Public read segment results" ON segment_results;
DROP POLICY IF EXISTS "Creators manage segment results" ON segment_results;

-- Stage Segments: Public Read, Creator Write
CREATE POLICY "Public read stage segments" ON stage_segments 
    FOR SELECT USING (true);

CREATE POLICY "Creators manage stage segments" ON stage_segments 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM event_stages es
            JOIN events e ON e.id = es.event_id
            WHERE es.id = stage_segments.stage_id 
              AND e.creator_id = auth.uid()
        )
    );

-- Segment Results: Public Read, Creator Write
CREATE POLICY "Public read segment results" ON segment_results 
    FOR SELECT USING (true);

CREATE POLICY "Creators manage segment results" ON segment_results 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stage_segments ss
            JOIN event_stages es ON es.id = ss.stage_id
            JOIN events e ON e.id = es.event_id
            WHERE ss.id = segment_results.segment_id 
              AND e.creator_id = auth.uid()
        )
    );

-- ============================================================================
-- 4. HELPER INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_stage_segments_stage_id ON stage_segments(stage_id);
CREATE INDEX IF NOT EXISTS idx_segment_results_segment_id ON segment_results(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_results_user_id ON segment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_segment_results_stage_id ON segment_results(stage_id);

-- ============================================================================
-- 5. UPDATE TRIGGER FOR updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_stage_segments_updated_at ON stage_segments;
CREATE TRIGGER update_stage_segments_updated_at
    BEFORE UPDATE ON stage_segments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_segment_results_updated_at ON segment_results;
CREATE TRIGGER update_segment_results_updated_at
    BEFORE UPDATE ON segment_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. DEFAULT POINTS SCALES BY CATEGORY (Reference)
-- ============================================================================
-- HC:   [20, 15, 12, 10]  - Hors Catégorie (hardest climbs)
-- Cat1: [15, 12, 10, 8]   - Category 1
-- Cat2: [10, 8, 6, 4]     - Category 2
-- Cat3: [6, 4, 2, 1]      - Category 3
-- Cat4: [5, 3, 2, 1]      - Category 4
