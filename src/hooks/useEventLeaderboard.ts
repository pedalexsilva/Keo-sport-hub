import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export interface LeaderboardEntry {
    user_id: string;
    rank: number;
    user?: Profile;
    // GC Specific
    total_time_seconds?: number;
    gap_seconds?: number;
    // Mountain Specific
    total_points?: number;
}

export function useEventLeaderboard(eventId: string, type: 'gc' | 'mountain' = 'gc') {
    return useQuery({
        queryKey: ['leaderboard', eventId, type],
        queryFn: async () => {
            const table = type === 'gc' ? 'general_classification' : 'mountain_classification';
            const orderCol = type === 'gc' ? 'rank' : 'rank'; 
            
            // Fetch Data
            const { data, error } = await supabase
                .from(table)
                .select(`
                    *,
                    user:profiles(id, full_name, avatar_url, office)
                `)
                .eq('event_id', eventId)
                .order('rank', { ascending: true });

            if (error) throw error;
            return data as LeaderboardEntry[];
        },
        enabled: !!eventId
    });
}
