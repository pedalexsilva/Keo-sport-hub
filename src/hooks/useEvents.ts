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
          )
        `)
                .order('date', { ascending: true });

            if (error) throw error;

            return data.map((e: any) => ({
                id: e.id,
                title: e.title,
                description: e.description,
                date: e.date,
                location: e.location,
                type: e.type as ActivityType,
                image: e.image_url || `https://picsum.photos/400/200?random=${e.id}`, // Placeholder if null
                creatorId: e.creator_id,
                participants: e.event_participants.map((p: any) => p.user_id)
            }));
        }
    });
}

export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newEvent: Omit<Event, 'id' | 'participants' | 'image'>) => {
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
                    creator_id: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // Auto-join creator?
            await supabase
                .from('event_participants')
                .insert({ event_id: data.id, user_id: user.id });

            return data;
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
