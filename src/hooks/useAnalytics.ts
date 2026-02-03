import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface GlobalStats {
    totalDistance: number; // km
    totalCalories: number; // kcal
    totalCo2: number; // kg
    weeklyActivity: number[]; // 7 days history
}

export function useGlobalStats() {
    return useQuery({
        queryKey: ['admin_global_stats'],
        queryFn: async (): Promise<GlobalStats> => {
            // 1. Fetch aggregated totals
            // Note: In a large scale app we would use a materialized view or RPC
            const { data: metrics, error } = await supabase
                .from('workout_metrics')
                .select('distance_meters, calories, start_time');

            if (error) throw error;

            let totalDistanceMeters = 0;
            let totalCalories = 0;
            
            // Initialize weekly stats (last 7 days, 0 = today, 6 = 6 days ago)
            // But UI expects [Sun, Mon, Tue...] or [Day 1, Day 2...]
            // The UI AdminDashboard expects 7 values. Let's map them to "Last 7 days" or "Current Week"
            const weeklyActivity = [0, 0, 0, 0, 0, 0, 0];
            const now = new Date();
            const today = now.getDay(); // 0 = Sunday

            // We want to show activity for the current week (Sun-Sat) or last 7 days? 
            // The UI labels are ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] which looks like Dom, Seg, Ter... (Sun, Mon, Tue...)
            // So we should map to day of week.

            metrics?.forEach(m => {
                totalDistanceMeters += m.distance_meters || 0;
                totalCalories += m.calories || 0;

                const date = new Date(m.start_time);
                // Check if it's in the current week window (simple approach: match day of week if recent)
                // Better: Check if within last 7 days
                const diffTime = Math.abs(now.getTime() - date.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays <= 7) {
                    const dayIndex = date.getDay(); // 0-6
                    weeklyActivity[dayIndex] += 1; // Count active users/sessions per day
                }
            });

            const totalDistance = Math.round(totalDistanceMeters / 1000);
            const totalCo2 = Math.round(totalDistance * 0.21); // ~0.21kg CO2 saved per km cycled/run vs car

            return {
                totalDistance,
                totalCalories: Math.round(totalCalories),
                totalCo2,
                weeklyActivity
            };
        }
    });
}
