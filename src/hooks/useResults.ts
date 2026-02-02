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
            const { data, error } = await supabase
                .from('general_classification')
                .select(`
                    *,
                    profile:profiles!user_id(
                        email,
                        full_name
                    )
                `)
                .eq('event_id', eventId)
                .order('total_time_seconds', { ascending: true });

            if (error) throw error;

            return data.map((d: any) => ({
                ...d,
                profile: {
                    name: d.profile?.full_name || d.profile?.email || 'Unknown',
                    email: d.profile?.email
                }
            })) as GCResult[];
        },
        enabled: !!eventId
    });
}

export function useMountainClassification(eventId?: string) {
    return useQuery({
        queryKey: ['mountain', eventId],
        queryFn: async () => {
            if (!eventId) return [];
            const { data, error } = await supabase
                .from('mountain_classification')
                .select(`
                    *,
                    profile:profiles!user_id(
                        email,
                        full_name
                    )
                `)
                .eq('event_id', eventId)
                .order('total_points', { ascending: false });

            if (error) throw error;
            return data.map((d: any) => ({
                ...d,
                profile: {
                    name: d.profile?.full_name || d.profile?.email || 'Unknown',
                    email: d.profile?.email
                }
            })) as MountainResult[];
        },
        enabled: !!eventId
    });
}
