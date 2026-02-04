-- Migration: Fix Stage Segments RLS Policy for INSERT
-- Date: 2026-02-04
-- Description: Fixes the RLS policy to allow event creators to insert new segments

-- ============================================================================
-- FIX STAGE SEGMENTS POLICY
-- ============================================================================
-- The original policy only had USING clause which doesn't work for INSERT.
-- We need separate policies for SELECT/UPDATE/DELETE (using USING) and INSERT (using WITH CHECK)

-- Drop existing policies
DROP POLICY IF EXISTS "Creators manage stage segments" ON stage_segments;

-- Create separate policies for different operations

-- SELECT, UPDATE, DELETE - uses USING clause (checks existing rows)
CREATE POLICY "Creators read update delete stage segments" ON stage_segments 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM event_stages es
            JOIN events e ON e.id = es.event_id
            WHERE es.id = stage_segments.stage_id 
              AND e.creator_id = auth.uid()
        )
    );

-- INSERT - uses WITH CHECK clause (validates new rows being inserted)
CREATE POLICY "Creators insert stage segments" ON stage_segments 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM event_stages es
            JOIN events e ON e.id = es.event_id
            WHERE es.id = stage_id 
              AND e.creator_id = auth.uid()
        )
    );

-- ============================================================================
-- FIX SEGMENT RESULTS POLICY (same issue)
-- ============================================================================
DROP POLICY IF EXISTS "Creators manage segment results" ON segment_results;

-- SELECT, UPDATE, DELETE
CREATE POLICY "Creators read update delete segment results" ON segment_results 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stage_segments ss
            JOIN event_stages es ON es.id = ss.stage_id
            JOIN events e ON e.id = es.event_id
            WHERE ss.id = segment_results.segment_id 
              AND e.creator_id = auth.uid()
        )
    );

-- INSERT
CREATE POLICY "Creators insert segment results" ON segment_results 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stage_segments ss
            JOIN event_stages es ON es.id = ss.stage_id
            JOIN events e ON e.id = es.event_id
            WHERE ss.id = segment_id 
              AND e.creator_id = auth.uid()
        )
    );

-- ============================================================================
-- ALSO ADD ADMIN POLICY (admins should be able to manage all segments)
-- ============================================================================
DROP POLICY IF EXISTS "Admins manage stage segments" ON stage_segments;
DROP POLICY IF EXISTS "Admins manage segment results" ON segment_results;

CREATE POLICY "Admins manage stage segments" ON stage_segments 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
              AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins manage segment results" ON segment_results 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
              AND profiles.role = 'admin'
        )
    );
