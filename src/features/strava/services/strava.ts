import { supabase } from '../../../lib/supabase';

const CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const REDIRECT_URI = window.location.origin + '/strava/callback'; // Determine dynamically

export const getStravaAuthUrl = () => {
    const scope = 'read,activity:read_all';
    return `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=${scope}`;
};

export const exchangeToken = async (code: string) => {
    // Note: In a production app, token exchange should happen on the server (Supabase Edge Function) 
    // to keep CLIENT_SECRET secure. However, Strava allows generic public clients if secret is not critical?
    // Actually, CLIENT_SECRET *must* be kept secret. But for this MVP without a dedicated backend server,
    // we might do it client-side temporarily or assume Supabase Function.
    // Given the user wants "Professional", we should ideally use a Supabase Edge Function.
    // BUT we don't have Edge Functions setup easily here without CLI login.
    // We will do it client-side but WARN. Or we proxy via a simple Netlify function?

    // For now, client-side exchange (Risk: Secret exposed in build).
    const CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET;

    if (!CLIENT_SECRET) {
        throw new Error('Missing VITE_STRAVA_CLIENT_SECRET. Please check your .env file.');
    }

    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to exchange token');
    }

    const data = await response.json();
    return data;
};

export const saveStravaTokens = async (userId: string, data: any) => {
    const { error } = await supabase
        .from('profiles')
        .update({
            strava_access_token: data.access_token,
            strava_refresh_token: data.refresh_token,
            strava_expires_at: data.expires_at,
        })
        .eq('id', userId);

    if (error) throw error;
};
