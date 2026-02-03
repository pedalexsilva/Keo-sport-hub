import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface GCResult {
    user_id: string;
    total_time_seconds: number;
    rank: number;
    gap_seconds: number;
    profile: {
        name: string;
        email: string;
    };
}

export interface MountainResult {
    user_id: string;
    total_points: number;
    rank: number;
    profile: {
        name: string;
        email: string;
    };
}

export function useGeneralClassification(eventId?: string) {
    return useQuery({
        queryKey: ['gc', eventId],
        queryFn: async () => {
            if (!eventId) return [];
            
            // 1. Fetch results
            const { data: results, error } = await supabase
                .from('general_classification')
                .select('*')
                .eq('event_id', eventId)
                .order('total_time_seconds', { ascending: true });

            if (error) throw error;
            if (!results?.length) return [];

            // 2. Fetch profiles manually
            const userIds = Array.from(new Set(results.map(r => r.user_id)));
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            // 3. Merge
            return results.map((d: any) => {
                const profile = profileMap.get(d.user_id);
                return {
                    ...d,
                    profile: {
                        name: profile?.full_name || profile?.email || 'Unknown',
                        email: profile?.email
                    }
                };
            }) as GCResult[];
        },
        enabled: !!eventId
    });
}

export function useMountainClassification(eventId?: string) {
    return useQuery({
        queryKey: ['mountain', eventId],
        queryFn: async () => {
            if (!eventId) return [];
            
            // 1. Fetch results
            const { data: results, error } = await supabase
                .from('mountain_classification')
                .select('*')
                .eq('event_id', eventId)
                .order('total_points', { ascending: false });

            if (error) throw error;
            if (!results?.length) return [];

            // 2. Fetch profiles manually
            const userIds = Array.from(new Set(results.map(r => r.user_id)));
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            // 3. Merge
            return results.map((d: any) => {
                const profile = profileMap.get(d.user_id);
                return {
                    ...d,
                    profile: {
                        name: profile?.full_name || profile?.email || 'Unknown',
                        email: profile?.email
                    }
                };
            }) as MountainResult[];
        },
        enabled: !!eventId
    });
}
