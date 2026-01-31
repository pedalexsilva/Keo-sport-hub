import { supabase } from '../../../lib/supabase';
import { StravaRateLimiter } from './RateLimiter';

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
    // SECURITY UPDATE: Save to user_secrets instead of profiles
    const { error } = await supabase
        .from('user_secrets')
        .upsert({
            id: userId,
            strava_access_token: data.access_token,
            strava_refresh_token: data.refresh_token,
            strava_expires_at: data.expires_at,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

    if (error) throw error;

    // Also update profile status to show connected
    await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', userId);
};

export const getRecentActivities = async (accessToken: string, afterTimestamp: number) => {
    // Rate Limit Check
    if (!(await StravaRateLimiter.canMakeRequest())) {
        throw new Error('Rate limit reached. Please try again later.');
    }

    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${afterTimestamp}&per_page=30`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    // Record usage
    StravaRateLimiter.incrementUsage();

    if (response.status === 429) {
        throw new Error('Strava API Rate Limit Exceeded (429)');
    }

    if (!response.ok) {
        throw new Error('Failed to fetch Strava activities');
    }

    return await response.json();
};

export const syncStravaActivities = async (userId: string) => {
    // 1. Get User Tokens from SECURE table
    const { data: secrets, error: secretError } = await supabase
        .from('user_secrets')
        .select('strava_access_token, strava_refresh_token, strava_expires_at')
        .eq('id', userId)
        .single();

    if (secretError || !secrets?.strava_access_token) {
        throw new Error('User not connected to Strava');
    }

    let accessToken = secrets.strava_access_token;

    // 2. Check Token Expiry & Refresh if needed
    if (secrets.strava_expires_at && Date.now() / 1000 > secrets.strava_expires_at) {
        const CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
        const CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET;

        // Note: Client-side refresh (Same risk as exchangeToken)
        const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: secrets.strava_refresh_token,
            }),
        });

        if (!refreshResponse.ok) {
            throw new Error('Failed to refresh Strava token');
        }

        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;

        // Save new tokens
        await saveStravaTokens(userId, refreshData);
    }

    // 3. Fetch Last 7 Days Activities
    const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    const activities = await getRecentActivities(accessToken, sevenDaysAgo);

    if (!activities || activities.length === 0) {
        return { count: 0, message: 'No new activities found.' };
    }

    // 4. Save to Database
    let savedCount = 0;
    for (const act of activities) {
        // Map Strava activity to our DB schema
        const activityData = {
            id: act.id.toString(), // Use Strava ID as primary key
            user_id: userId,
            type: act.type, // 'Run', 'Ride', etc.
            distance: act.distance,
            duration: act.moving_time,
            date: act.start_date,
            title: act.name,
            points: Math.round(act.distance / 1000 * 10), // Simple point logic: 10 pts per km
            external_id: act.id.toString(),
            source: 'strava'
        };

        const { error } = await supabase
            .from('activities')
            .upsert(activityData, { onConflict: 'id' });

        if (!error) savedCount++;
    }

    return { count: savedCount, message: `Synced ${savedCount} activities.` };
};

export const disconnectStrava = async (userId: string) => {
    // 1. Clear tokens from secure table
    const { error } = await supabase
        .from('user_secrets')
        .update({
            strava_access_token: null,
            strava_refresh_token: null,
            strava_expires_at: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) throw error;

    // 2. Ideally revoke on Strava side too (requires token before deleting), 
    // but for now clearing local access is sufficient to "disconnect" the app.
};
