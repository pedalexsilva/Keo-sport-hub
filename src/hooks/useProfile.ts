import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export function useProfile(userId?: string) {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async (): Promise<User | null> => {
            if (!userId) return null;

            // Fetch Profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            // Fetch Connection Status (device_connections)
            const { data: connection } = await supabase
                .from('device_connections')
                .select('is_active')
                .eq('user_id', userId)
                .eq('platform', 'strava')
                .maybeSingle();

            // Fetch Activities Summary (for total points only)
            const { data: pointsData, error: pointsError } = await supabase
                .from('workout_metrics')
                .select('points')
                .eq('user_id', userId);

            if (pointsError) throw pointsError;

            // Fetch Recent Activities (top 5 only)
            const { data: recentActivities, error: activityError } = await supabase
                .from('workout_metrics')
                .select('id, type, title, distance_meters, duration_seconds, calories, start_time, points')
                .eq('user_id', userId)
                .order('start_time', { ascending: false })
                .limit(5);

            if (activityError) throw activityError;

            // Map to User type
            const totalPoints = pointsData?.reduce((sum, act) => sum + (act.points || 0), 0) || 0;

            return {
                id: profile.id,
                name: profile.full_name || profile.username || 'Atleta',
                avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.username || 'User')}&background=random`,
                role: profile.role,
                office: profile.office,
                onboardingCompleted: profile.onboarding_completed || false,
                isConnectedToStrava: connection?.is_active || false,
                totalPoints,
                rank: 0, // Calculated separately or in leaderboard view
                activities: recentActivities?.map(a => ({
                    id: a.id,
                    type: a.type,
                    title: a.title,
                    distance: a.distance_meters ? a.distance_meters / 1000 : 0,
                    duration: a.duration_seconds ? Math.round(a.duration_seconds / 60) : 0, // Minutes
                    calories: a.calories,
                    date: a.start_time,
                    points: a.points || 0
                })) || []
            };
        },
        enabled: !!userId,
    });
}
