import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface OfficeLeaderboardEntry {
    office: string;
    total_points: number;
    member_count: number;
}

export function useOfficeLeaderboard() {
    return useQuery({
        queryKey: ['officeLeaderboard'],
        queryFn: async (): Promise<OfficeLeaderboardEntry[]> => {
            const { data, error } = await supabase
                .from('office_leaderboard')
                .select('*')
                .limit(10); // Check top offices

            if (error) throw error;

            return data;
        }
    });
}
