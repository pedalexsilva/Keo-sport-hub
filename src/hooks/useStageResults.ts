import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StageInfo {
    id: string;
    name: string;
    stage_order: number;
    date: string;
    status: 'pending' | 'official' | 'mixed'; // mixed = some results official, some pending
    results_count: number;
    official_count: number;
}

export interface StageResultEntry {
    id: string;
    stage_id: string;
    user_id: string;
    elapsed_time_seconds: number;
    official_time_seconds: number | null;
    mountain_points: number;
    status: 'pending' | 'official' | 'dq';
    strava_activity_id: string;
    rank?: number;
    profile: {
        id: string;
        full_name: string;
        email: string;
        avatar_url?: string;
    };
}

export interface UserStageBreakdown {
    user_id: string;
    profile: {
        full_name: string;
        avatar_url?: string;
    };
    stages: {
        stage_id: string;
        stage_name: string;
        stage_order: number;
        time_seconds: number;
        status: 'pending' | 'official' | 'dq';
    }[];
    total_time_seconds: number;
    stages_completed: number;
    stages_official: number;
}

/**
 * Fetch all stages for an event with their status summary
 */
export function useEventStages(eventId?: string) {
    return useQuery({
        queryKey: ['event-stages', eventId],
        queryFn: async () => {
            if (!eventId) return [];

            // Fetch stages
            const { data: stages, error: stagesError } = await supabase
                .from('event_stages')
                .select('id, name, stage_order, date')
                .eq('event_id', eventId)
                .order('stage_order', { ascending: true });

            if (stagesError) throw stagesError;
            if (!stages?.length) return [];

            // Fetch result counts per stage
            const stageIds = stages.map(s => s.id);
            const { data: results, error: resultsError } = await supabase
                .from('stage_results')
                .select('stage_id, status')
                .in('stage_id', stageIds);

            if (resultsError) throw resultsError;

            // Aggregate counts
            const countMap = new Map<string, { total: number; official: number }>();
            stageIds.forEach(id => countMap.set(id, { total: 0, official: 0 }));

            (results || []).forEach((r: any) => {
                const entry = countMap.get(r.stage_id);
                if (entry) {
                    entry.total++;
                    if (r.status === 'official') entry.official++;
                }
            });

            return stages.map(s => {
                const counts = countMap.get(s.id) || { total: 0, official: 0 };
                let status: 'pending' | 'official' | 'mixed' = 'pending';
                if (counts.total > 0) {
                    if (counts.official === counts.total) status = 'official';
                    else if (counts.official > 0) status = 'mixed';
                }
                return {
                    id: s.id,
                    name: s.name,
                    stage_order: s.stage_order,
                    date: s.date,
                    status,
                    results_count: counts.total,
                    official_count: counts.official
                } as StageInfo;
            });
        },
        enabled: !!eventId
    });
}

/**
 * Fetch results for a single stage, ordered by time
 */
export function useStageResults(stageId?: string) {
    return useQuery({
        queryKey: ['stage-results', stageId],
        queryFn: async () => {
            if (!stageId) return [];

            // 1. Fetch results
            const { data: results, error } = await supabase
                .from('stage_results')
                .select('*')
                .eq('stage_id', stageId)
                .order('elapsed_time_seconds', { ascending: true });

            if (error) throw error;
            if (!results?.length) return [];

            // 2. Fetch profiles
            const userIds = Array.from(new Set(results.map(r => r.user_id)));
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email, avatar_url')
                .in('id', userIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            // 3. Merge and rank
            return results.map((r: any, idx: number) => {
                const profile = profileMap.get(r.user_id);
                return {
                    ...r,
                    rank: idx + 1,
                    profile: {
                        id: r.user_id,
                        full_name: profile?.full_name || 'Unknown',
                        email: profile?.email || '',
                        avatar_url: profile?.avatar_url
                    }
                } as StageResultEntry;
            });
        },
        enabled: !!stageId
    });
}

/**
 * Fetch stage breakdown for all users in an event (for GC with per-stage times)
 */
export function useEventStageBreakdown(eventId?: string) {
    return useQuery({
        queryKey: ['event-stage-breakdown', eventId],
        queryFn: async () => {
            if (!eventId) return [];

            // 1. Fetch all stages for this event
            const { data: stages, error: stagesError } = await supabase
                .from('event_stages')
                .select('id, name, stage_order')
                .eq('event_id', eventId)
                .order('stage_order', { ascending: true });

            if (stagesError) throw stagesError;
            if (!stages?.length) return [];

            const stageIds = stages.map(s => s.id);

            // 2. Fetch all event participants (to show everyone in GC)
            const { data: participants, error: partError } = await supabase
                .from('event_participants')
                .select('user_id')
                .eq('event_id', eventId);
            
            if (partError) throw partError;

            // 3. Fetch all results for these stages
            const { data: results, error: resultsError } = await supabase
                .from('stage_results')
                .select('*')
                .in('stage_id', stageIds);

            if (resultsError) throw resultsError;

            // 4. Fetch profiles for ALL participants + any results (safety)
            const allUserIds = Array.from(new Set([
                ...(participants?.map(p => p.user_id) || []),
                ...(results?.map(r => r.user_id) || [])
            ]));
            
            if (allUserIds.length === 0) return [];

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', allUserIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p]));
            const stageMap = new Map(stages.map(s => [s.id, s]));

            // 5. Group by user
            const userBreakdown = new Map<string, UserStageBreakdown>();

            // Initialize for everyone
            allUserIds.forEach(userId => {
                const profile = profileMap.get(userId);
                userBreakdown.set(userId, {
                    user_id: userId,
                    profile: {
                        full_name: profile?.full_name || 'Unknown',
                        avatar_url: profile?.avatar_url
                    },
                    stages: [],
                    total_time_seconds: 0,
                    stages_completed: 0,
                    stages_official: 0
                });
            });

            // Populate results
            (results || []).forEach((r: any) => {
                const breakdown = userBreakdown.get(r.user_id);
                // Should exist from init above, but safety check
                if (!breakdown) return;
                const stage = stageMap.get(r.stage_id);

                if (stage) {
                    const timeToUse = r.official_time_seconds ?? r.elapsed_time_seconds;
                    breakdown.stages.push({
                        stage_id: r.stage_id,
                        stage_name: stage.name,
                        stage_order: stage.stage_order,
                        time_seconds: timeToUse,
                        status: r.status
                    });

                    // Count official and pending results in total (Provisional GC)
                    if (r.status === 'official' || r.status === 'pending') {
                        breakdown.total_time_seconds += timeToUse;
                    }
                    
                    if (r.status === 'official') {
                        breakdown.stages_official++;
                    }
                    breakdown.stages_completed++;
                }
            });

            // 5. Sort stages within each user and sort users by total time
            const breakdownArray = Array.from(userBreakdown.values());
            breakdownArray.forEach(b => {
                b.stages.sort((a, b) => a.stage_order - b.stage_order);
            });
            
            // Sort by total time ASC. 
            // Important: Users with 0 total time (no valid stages) should be at the bottom
            breakdownArray.sort((a, b) => {
                if (a.total_time_seconds === 0 && b.total_time_seconds === 0) return 0;
                if (a.total_time_seconds === 0) return 1; // a goes to bottom
                if (b.total_time_seconds === 0) return -1; // b goes to bottom
                
                return a.total_time_seconds - b.total_time_seconds;
            });

            return breakdownArray;
        },
        enabled: !!eventId
    });
}
