import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface LeaderboardEntry {
    user_id: string;
    full_name: string;
    avatar_url: string;
    total_points: number;
    activity_count: number;
    rank: number;
    office?: string;
}

export function useLeaderboard() {
    return useQuery({
        queryKey: ['leaderboard'],
        queryFn: async (): Promise<LeaderboardEntry[]> => {
            const { data, error } = await supabase
                .from('leaderboard')
                .select('user_id, full_name, avatar_url, total_points, activity_count, office')
                .limit(50); // Top 50

            if (error) throw error;

            return data.map((entry, index) => ({
                ...entry,
                rank: index + 1
            }));
        }
    });
}
