import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Event, ActivityType } from '../types';

export function useEvents() {
    return useQuery({
        queryKey: ['events'],
        queryFn: async (): Promise<Event[]> => {
            const { data, error } = await supabase
                .from('events')
                .select(`
          *,
          event_participants (
            user_id
          ),
          event_stages (
            date
          )
        `)
                .order('date', { ascending: true });

            if (error) throw error;

            // Collect all unique user IDs from participants to fetch profiles efficiently
            const allUserIds = new Set<string>();
            data.forEach((e: any) => {
                e.event_participants.forEach((p: any) => allUserIds.add(p.user_id));
            });

            // Fetch profiles for these IDs
            let profilesMap = new Map<string, any>();

            if (allUserIds.size > 0) {
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, office, avatar_url')
                    .in('id', Array.from(allUserIds));

                if (profilesError) throw profilesError;

                profilesMap = new Map(profiles?.map(p => [p.id, p]));
            }

            return data.map((e: any) => {
                const stages = e.event_stages || [];
                let endDate = e.date;

                if (stages.length > 0) {
                    // Find the latest stage date
                    const lastStage = stages.reduce((latest: any, current: any) => {
                        return new Date(current.date) > new Date(latest.date) ? current : latest;
                    }, stages[0]);
                    endDate = lastStage.date;
                }

                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                const isPast = end < new Date();

                return {
                    id: e.id,
                    title: e.title,
                    description: e.description,
                    date: e.date,
                    endDate: endDate,
                    location: e.location,
                    type: e.type as ActivityType,
                    image: e.image_url || `https://placehold.co/600x400/e2e8f0/1e293b?text=${encodeURIComponent(e.title || 'Event')}`,
                    creatorId: e.creator_id,
                    participants: e.event_participants.map((p: any) => {
                        const profile = profilesMap.get(p.user_id);
                        return {
                            id: p.user_id,
                            name: profile?.full_name || profile?.username || 'Utilizador',
                            office: profile?.office || 'KEO',
                            avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || profile?.username || 'User')}&background=random`
                        };
                    }),
                    maxParticipants: e.max_participants,
                    status: (isPast && e.status === 'open') ? 'closed' : e.status,
                    mode: e.mode || 'social'
                };
            });
        }
    });
}

export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newEvent: Omit<Event, 'id' | 'participants' | 'creatorId'>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('events')
                .insert({
                    title: newEvent.title,
                    description: newEvent.description,
                    date: newEvent.date,
                    location: newEvent.location,
                    type: newEvent.type,
                    image_url: newEvent.image,
                    max_participants: newEvent.maxParticipants,
                    status: newEvent.status || 'open',
                    mode: newEvent.mode || 'social',
                    creator_id: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // Removed auto-join creator logic as per requirement

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        }
    });
}

export function useUpdateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (event: Partial<Event> & { id: string }) => {
            const { error } = await supabase
                .from('events')
                .update({
                    title: event.title,
                    description: event.description,
                    date: event.date,
                    location: event.location,
                    type: event.type,
                    image_url: event.image,
                    max_participants: event.maxParticipants,
                    status: event.status,
                    mode: event.mode
                })
                .eq('id', event.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        }
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventId: string) => {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        }
    });
}

export function useJoinEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ eventId, userId, isJoining }: { eventId: string, userId: string, isJoining: boolean }) => {
            if (isJoining) {
                const { error } = await supabase
                    .from('event_participants')
                    .insert({ event_id: eventId, user_id: userId });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('event_participants')
                    .delete()
                    .eq('event_id', eventId)
                    .eq('user_id', userId);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        }
    });
}

export const uploadEventMedia = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('event-media')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('event-media')
        .getPublicUrl(filePath);

    return data.publicUrl;
};
