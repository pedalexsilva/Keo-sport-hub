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
                image: e.image_url || `https://placehold.co/600x400/e2e8f0/1e293b?text=${encodeURIComponent(e.title || 'Event')}`, // Placeholder if null
                creatorId: e.creator_id,
                participants: e.event_participants.map((p: any) => p.user_id),
                maxParticipants: e.max_participants,
                status: (new Date(e.date) < new Date() && e.status === 'open') ? 'closed' : e.status
            }));
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
                    status: event.status
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
