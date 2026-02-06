import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export type SegmentCategory = 'hc' | 'cat1' | 'cat2' | 'cat3' | 'cat4';

export interface StageSegment {
    id: string;
    stage_id: string;
    strava_segment_id: string;
    name: string;
    distance_meters?: number;
    avg_grade_percent?: number;
    category: SegmentCategory;
    points_scale: number[];  // [15, 12, 10, 8]
    segment_order: number;
    created_at?: string;
    updated_at?: string;
}

export interface SegmentResult {
    id: string;
    stage_id: string;
    segment_id: string;
    user_id: string;
    strava_effort_id?: string;
    elapsed_time_seconds: number;
    position?: number;
    points_earned: number;
    status: 'pending' | 'official' | 'dq';
    created_at?: string;
    updated_at?: string;
    // Joined data
    profile?: {
        full_name: string;
        avatar_url?: string;
        email?: string;
    };
    segment?: StageSegment;
}

// ============================================================================
// CONSTANTS - Default Points by Category
// ============================================================================

export const CATEGORY_CONFIG: Record<SegmentCategory, { 
    label: string;
    points: number[];
    color: string;
    bgColor: string;
}> = {
    hc: { 
        label: 'HC (Hors Catégorie)', 
        points: [20, 15, 12, 10], 
        color: '#dc2626',      // red-600
        bgColor: '#fef2f2'     // red-50
    },
    cat1: { 
        label: 'Category 1', 
        points: [15, 12, 10, 8], 
        color: '#ea580c',      // orange-600
        bgColor: '#fff7ed'     // orange-50
    },
    cat2: { 
        label: 'Category 2', 
        points: [10, 8, 6, 4], 
        color: '#ca8a04',      // yellow-600
        bgColor: '#fefce8'     // yellow-50
    },
    cat3: { 
        label: 'Category 3', 
        points: [6, 4, 2, 1], 
        color: '#16a34a',      // green-600
        bgColor: '#f0fdf4'     // green-50
    },
    cat4: { 
        label: 'Category 4', 
        points: [5, 3, 2, 1], 
        color: '#2563eb',      // blue-600
        bgColor: '#eff6ff'     // blue-50
    },
};

// ============================================================================
// HOOKS - Stage Segments
// ============================================================================

/**
 * Fetch all segments for a specific stage
 */
export function useStageSegments(stageId?: string) {
    return useQuery({
        queryKey: ['stage-segments', stageId],
        queryFn: async () => {
            if (!stageId) return [];
            
            const { data, error } = await supabase
                .from('stage_segments')
                .select('*')
                .eq('stage_id', stageId)
                .order('segment_order', { ascending: true });
            
            if (error) throw error;
            return data as StageSegment[];
        },
        enabled: !!stageId
    });
}

/**
 * Fetch all segments for an event (across all stages)
 */
export function useEventSegments(eventId?: string) {
    return useQuery({
        queryKey: ['event-segments', eventId],
        queryFn: async () => {
            if (!eventId) return [];
            
            const { data, error } = await supabase
                .from('stage_segments')
                .select(`
                    *,
                    stage:event_stages!inner(
                        id,
                        name,
                        stage_order,
                        event_id
                    )
                `)
                .eq('stage.event_id', eventId)
                .order('segment_order', { ascending: true });
            
            if (error) throw error;
            return data;
        },
        enabled: !!eventId
    });
}

/**
 * Create a new segment
 */
export function useCreateSegment() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (segment: Omit<StageSegment, 'id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('stage_segments')
                .insert(segment)
                .select()
                .single();
            
            if (error) throw error;
            return data as StageSegment;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['stage-segments', variables.stage_id] });
            queryClient.invalidateQueries({ queryKey: ['event-segments'] });
        }
    });
}

/**
 * Update an existing segment
 */
export function useUpdateSegment() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (segment: Partial<StageSegment> & { id: string }) => {
            const { data, error } = await supabase
                .from('stage_segments')
                .update({
                    name: segment.name,
                    strava_segment_id: segment.strava_segment_id,
                    distance_meters: segment.distance_meters,
                    avg_grade_percent: segment.avg_grade_percent,
                    category: segment.category,
                    points_scale: segment.points_scale,
                    segment_order: segment.segment_order
                })
                .eq('id', segment.id)
                .select()
                .single();
            
            if (error) throw error;
            return data as StageSegment;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['stage-segments', data.stage_id] });
            queryClient.invalidateQueries({ queryKey: ['event-segments'] });
        }
    });
}

/**
 * Delete a segment
 */
export function useDeleteSegment() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('stage_segments')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stage-segments'] });
            queryClient.invalidateQueries({ queryKey: ['event-segments'] });
        }
    });
}

// ============================================================================
// HOOKS - Segment Results
// ============================================================================

/**
 * Fetch results for a specific segment
 */
export function useSegmentResults(segmentId?: string) {
    return useQuery({
        queryKey: ['segment-results', segmentId],
        queryFn: async () => {
            if (!segmentId) return [];
            
            const { data, error } = await supabase
                .from('segment_results')
                .select(`
                    *,
                    profile:profiles!user_id(full_name, avatar_url, email)
                `)
                .eq('segment_id', segmentId)
                .order('elapsed_time_seconds', { ascending: true });
            
            if (error) throw error;
            return data as SegmentResult[];
        },
        enabled: !!segmentId
    });
}

/**
 * Fetch all segment results for a stage (grouped by segment)
 */
export function useStageSegmentResults(stageId?: string) {
    return useQuery({
        queryKey: ['stage-segment-results', stageId],
        queryFn: async () => {
            if (!stageId) return [];
            
            const { data, error } = await supabase
                .from('segment_results')
                .select(`
                    *,
                    profile:profiles!user_id(full_name, avatar_url, email),
                    segment:stage_segments!segment_id(*)
                `)
                .eq('stage_id', stageId)
                .order('elapsed_time_seconds', { ascending: true });
            
            if (error) throw error;
            return data as SegmentResult[];
        },
        enabled: !!stageId
    });
}

/**
 * Update segment result (for admin validation)
 */
export function useUpdateSegmentResult() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (result: Partial<SegmentResult> & { id: string }) => {
            const { data, error } = await supabase
                .from('segment_results')
                .update({
                    elapsed_time_seconds: result.elapsed_time_seconds,
                    position: result.position,
                    points_earned: result.points_earned,
                    status: result.status
                })
                .eq('id', result.id)
                .select()
                .single();
            
            if (error) throw error;
            return data as SegmentResult;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['segment-results', data.segment_id] });
            queryClient.invalidateQueries({ queryKey: ['stage-segment-results', data.stage_id] });
        }
    });
}

// ============================================================================
// HOOKS - KOM Classification (Aggregated)
// ============================================================================

export interface KOMClassificationEntry {
    user_id: string;
    total_points: number;
    segments_completed: number;
    profile: {
        full_name: string;
        avatar_url?: string;
    };
}

/**
 * Fetch KOM classification for an event (sum of all mountain points from stage_results)
 */
export function useKOMClassification(eventId?: string) {
    return useQuery({
        queryKey: ['kom-classification', eventId],
        queryFn: async () => {
            if (!eventId) return [];
            
            // 1. Get all stages for this event
            const { data: stages, error: stagesError } = await supabase
                .from('event_stages')
                .select('id')
                .eq('event_id', eventId);
            
            if (stagesError) throw stagesError;
            if (!stages?.length) return [];
            
            const stageIds = stages.map(s => s.id);
            
            // 2. Get all official stage results with mountain points
            const { data: results, error: resultsError } = await supabase
                .from('stage_results')
                .select('user_id, mountain_points, official_mountain_points, status')
                .in('stage_id', stageIds)
                .eq('status', 'official');
            
            if (resultsError) throw resultsError;
            if (!results?.length) return [];
            
            // 3. Get profiles for all users
            const userIds = [...new Set(results.map(r => r.user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds);
            
            const profileMap = new Map(profiles?.map(p => [p.id, p]));
            
            // 4. Aggregate points by user
            const userPoints = new Map<string, KOMClassificationEntry>();
            
            for (const result of results) {
                // Use official_mountain_points if available, otherwise mountain_points
                const points = result.official_mountain_points ?? result.mountain_points ?? 0;
                if (points === 0) continue; // Skip if no mountain points
                
                const existing = userPoints.get(result.user_id);
                if (existing) {
                    existing.total_points += points;
                    existing.segments_completed += 1;
                } else {
                    const profile = profileMap.get(result.user_id);
                    userPoints.set(result.user_id, {
                        user_id: result.user_id,
                        total_points: points,
                        segments_completed: 1, // Using this as "stages with mountain points"
                        profile: {
                            full_name: profile?.full_name || 'Unknown',
                            avatar_url: profile?.avatar_url
                        }
                    });
                }
            }
            
            // 5. Sort by points descending
            return Array.from(userPoints.values())
                .sort((a, b) => b.total_points - a.total_points);
        },
        enabled: !!eventId
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format elapsed time in seconds to HH:MM:SS
 */
export function formatSegmentTime(seconds: number): string {
    if (!seconds && seconds !== 0) return '-';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get points for a given position based on points scale
 */
export function getPointsForPosition(position: number, pointsScale: number[]): number {
    if (position < 1 || position > pointsScale.length) return 0;
    return pointsScale[position - 1] || 0;
}

/**
 * Format distance in meters to km
 */
export function formatDistance(meters?: number): string {
    if (!meters) return '-';
    return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format gradient percentage
 */
export function formatGradient(percent?: number): string {
    if (!percent && percent !== 0) return '-';
    return `${percent.toFixed(1)}%`;
}
