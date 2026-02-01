import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface UseStravaReturn {
    syncActivities: () => Promise<boolean>;
    isSyncing: boolean;
    error: string | null;
}

export function useStrava(): UseStravaReturn {
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const syncActivities = async (): Promise<boolean> => {
        setIsSyncing(true);
        setError(null);
        try {
            // Call the Edge Function 'strava-webhook' effectively, but usually manually syncing
            // implies calling a specific endpoint. 
            // For now, let's assume we invoke a function or just mock it if function doesn't exist yet.
            // But better: invoke the function.

            const { error: invokeError } = await supabase.functions.invoke('strava-sync', {
                method: 'POST',
            });

            if (invokeError) throw invokeError;

            // Invalidate queries to refresh data
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['activities'] });

            return true;
        } catch (err: any) {
            console.error('Strava sync error:', err);
            setError(err.message || 'Falha ao sincronizar');
            return false;
        } finally {
            setIsSyncing(false);
        }
    };

    return { syncActivities, isSyncing, error };
}
