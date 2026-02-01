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
            // Call the Edge Function 'strava-sync'
            const { data, error: invokeError } = await supabase.functions.invoke('strava-sync', {
                method: 'POST',
            });

            if (invokeError) {
                // Try to parse the error message from the response body if it's a FunctionsHttpError
                let errorMessage = invokeError.message;
                if ((invokeError as any).context?.body) {
                    try {
                        const body = JSON.parse((invokeError as any).context.body);
                        if (body.error) errorMessage = body.error;
                    } catch (e) {
                        // Not JSON, keep original message
                    }
                }
                throw new Error(errorMessage);
            }

            // Invalidate queries to refresh data
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['activities'] });
            await queryClient.invalidateQueries({ queryKey: ['workout_metrics'] });

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
