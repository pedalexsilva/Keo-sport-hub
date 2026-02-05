import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface GlobalStats {
    totalDistance: number; // km
    totalCalories: number; // kcal
    totalCo2: number; // kg
    weeklyActivity: number[]; // 7 days history
    periodLabel?: string;
}

export function useGlobalStats() {
    return useQuery({
        queryKey: ['admin_global_stats'],
        queryFn: async (): Promise<GlobalStats> => {
            // 1. Fetch aggregated totals
            // Note: In a large scale app we would use a materialized view or RPC
            const { data: metrics, error } = await supabase
                .from('workout_metrics')
                .select('distance_meters, calories, start_time')
                .order('start_time', { ascending: false });

            if (error) throw error;

            let totalDistanceMeters = 0;
            let totalCalories = 0;
            
            const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
            const now = new Date();
            
            // Calculate start of current week (Monday)
            const startOfWeek = new Date(now);
            const day = startOfWeek.getDay() || 7; // Sunday is 7, Monday is 1
            if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
            startOfWeek.setHours(0, 0, 0, 0);

            // Calculate end of week for label
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);

            const formatDate = (d: Date) => d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
            const periodLabel = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;

            metrics?.forEach(m => {
                totalDistanceMeters += m.distance_meters || 0;
                totalCalories += m.calories || 0;

                const date = new Date(m.start_time);
                
                // Check if date is within current week
                if (date >= startOfWeek) {
                    const dayIndex = (date.getDay() + 6) % 7; // Mon=0 .. Sun=6
                    weeklyActivity[dayIndex] += 1;
                }
            });

            const totalDistance = Math.round(totalDistanceMeters / 1000);
            const totalCo2 = Math.round(totalDistance * 0.21); // ~0.21kg CO2 saved per km cycled/run vs car

            return {
                totalDistance,
                totalCalories: Math.round(totalCalories),
                totalCo2,
                weeklyActivity,
                periodLabel
            };
        }
    });
}
