import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface ActivityStats {
    distance: number; // in km
    calories: number;
}

export function useActivityStats(userId: string | undefined) {
    return useQuery({
        queryKey: ['activityStats', userId],
        queryFn: async (): Promise<ActivityStats> => {
            if (!userId) return { distance: 0, calories: 0 };

            const { data, error } = await supabase
                .from('activities')
                .select('distance, calories')
                .eq('user_id', userId);

            if (error) {
                console.error('Error fetching activity stats:', error);
                throw error;
            }

            const stats = data.reduce((acc, curr) => ({
                distance: acc.distance + (curr.distance || 0),
                calories: acc.calories + (curr.calories || 0)
            }), { distance: 0, calories: 0 });

            // Convert distance from meters to km
            return {
                distance: Math.round(stats.distance / 1000),
                calories: Math.round(stats.calories)
            };
        },
        enabled: !!userId,
        initialData: { distance: 0, calories: 0 }
    });
}
