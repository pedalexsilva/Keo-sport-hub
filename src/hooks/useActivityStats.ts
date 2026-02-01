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

            // Calculate start of the current week (Monday)
            const now = new Date();
            const dayOfWeek = now.getDay();
            const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - diffToMonday);
            startOfWeek.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('workout_metrics')
                .select('distance_meters, calories')
                .eq('user_id', userId)
                .gte('start_time', startOfWeek.toISOString());

            if (error) {
                console.error('Error fetching activity stats:', error);
                throw error;
            }

            const stats = data.reduce((acc, curr) => ({
                distance: acc.distance + (curr.distance_meters || 0),
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
