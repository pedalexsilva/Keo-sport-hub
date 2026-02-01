import { supabase } from '../../../lib/supabase';

export const getStravaAuthUrl = async () => {
    // 1. Call secure backend to get URL (with state)
    // For simpler UX in this step, we can construct the URL here if we don't strictly enforce state yet,
    // BUT to follow the plan, we should ask the backend.

    const { data: { session } } = await supabase.auth.getSession();

    // Note: To use the 'authorize_url' action in our function:
    const { data, error } = await supabase.functions.invoke('strava-auth', {
        body: { type: 'authorize_url' }
    });

    if (error || !data?.url) {
        console.error('Failed to get auth URL', error);
        // Fallback or Error?
        throw new Error('Failed to initiate Strava connection');
    }

    return data.url;
};

export const exchangeToken = async (code: string) => {
    // Exchange on Server
    const { data, error } = await supabase.functions.invoke('strava-auth', {
        body: { code, type: 'exchange' }
    });

    if (error) {
        throw new Error(error.message || 'Token exchange failed');
    }

    return data;
};

export const syncStravaActivities = async (userId: string) => {
    // Call strava-sync Function
    const { data, error } = await supabase.functions.invoke('strava-sync', {
        method: 'POST'
    });

    if (error) {
        console.error('Sync Error:', error);
        throw new Error('Failed to sync activities');
    }

    return {
        count: data?.synced || 0,
        message: data?.message || 'Sync completed'
    };
};

export const disconnectStrava = async (userId: string) => {
    // 1. Delete connection record
    const { error } = await supabase
        .from('device_connections')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('platform', 'strava');

    // 2. Ideally call backend to delete tokens too
    await supabase.from('strava_tokens').delete().eq('user_id', userId);
};

