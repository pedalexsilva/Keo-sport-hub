import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface EventStage {
    id: string;
    event_id: string;
    name: string;
    description: string;
    image_url?: string;
    date: string;
    stage_order: number;
    mountain_segment_ids: string[];
    segment_points_map?: any;
}

export function useStages(eventId?: string) {
    return useQuery({
        queryKey: ['stages', eventId],
        queryFn: async () => {
            if (!eventId) return [];
            const { data, error } = await supabase
                .from('event_stages')
                .select('*')
                .eq('event_id', eventId)
                .order('stage_order', { ascending: true });

            if (error) throw error;
            return data as EventStage[];
        },
        enabled: !!eventId
    });
}

export function useCreateStage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (stage: Omit<EventStage, 'id'>) => {
            const { data, error } = await supabase
                .from('event_stages')
                .insert(stage)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['stages', variables.event_id] });
        }
    });
}

export function useUpdateStage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (stage: EventStage) => {
            const { data, error } = await supabase
                .from('event_stages')
                .update({
                    name: stage.name,
                    description: stage.description,
                    date: stage.date,
                    stage_order: stage.stage_order,
                    mountain_segment_ids: stage.mountain_segment_ids,
                    image_url: stage.image_url
                })
                .eq('id', stage.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['stages', variables.event_id] });
        }
    });
}

export function useDeleteStage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('event_stages')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stages'] });
        }
    });
}

export function useProcessStage() {
    return useMutation({
        mutationFn: async (stageId: string) => {
            const { data, error } = await supabase.functions.invoke('strava-process-stage', {
                body: { stage_id: stageId }
            });
            if (error) throw error;
            if (data.error) throw new Error(data.error);
            return data;
        }
    });
}
