import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface StageStats {
    stage_id: string;
    total: number;
    pending: number;
    official: number;
    dq: number;
}

export function useStageStats(eventId: string) {
    return useQuery({
        queryKey: ['stage-stats', eventId],
        queryFn: async () => {
            // Fetch all results for stages in this event
            // We use !inner to filter by event_id on the related table
            const { data, error } = await supabase
                .from('stage_results')
                .select(`
                    stage_id,
                    status,
                    event_stages!inner(event_id)
                `)
                .eq('event_stages.event_id', eventId);

            if (error) throw error;

            console.log("Stats Data:", data);

            // Aggregate in Memory (efficient enough for <1000 rows)
            const statsMap: Record<string, StageStats> = {};

            data.forEach((row: any) => {
                const sid = row.stage_id;
                if (!statsMap[sid]) {
                    statsMap[sid] = { stage_id: sid, total: 0, pending: 0, official: 0, dq: 0 };
                }
                statsMap[sid].total++;
                if (row.status === 'pending') statsMap[sid].pending++;
                else if (row.status === 'official') statsMap[sid].official++;
                else if (row.status === 'dq') statsMap[sid].dq++;
            });

            return statsMap;
        },
        enabled: !!eventId,
        refetchInterval: 30000 // Refresh every 30s
    });
}
