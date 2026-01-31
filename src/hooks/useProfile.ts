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

            // Fetch Activities Summary (or simplified view)
            // For MVP we fetch all activities for the user to calc stats client side
            // In prod we would use the 'leaderboard' view or DB functions
            const { data: activities, error: activityError } = await supabase
                .from('activities')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false });

            if (activityError) throw activityError;

            // Map to User type
            const totalPoints = activities?.reduce((sum, act) => sum + act.points, 0) || 0;

            return {
                id: profile.id,
                name: profile.full_name || profile.username || 'Atléta',
                avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.username || 'User')}&background=random`,
                isConnectedToStrava: !!profile.strava_access_token,
                totalPoints,
                rank: 0, // Calculated separately or in leaderboard view
                activities: activities?.map(a => ({
                    ...a,
                    date: a.date // Convert DB timestamp if needed, currently string is fine
                })) || []
            };
        },
        enabled: !!userId,
    });
}
