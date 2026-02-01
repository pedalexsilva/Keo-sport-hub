import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Authenticate User
        console.log("Authenticating user...")
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

        if (authError || !user) {
            console.error("Auth Error:", authError)
            throw new Error('Unauthorized: Invalid session')
        }

        const userId = user.id
        console.log(`User authenticated: ${userId}`)

        // 2. Get Strava Tokens
        const STRAVA_ENCRYPTION_KEY = Deno.env.get('STRAVA_ENCRYPTION_KEY')
        if (!STRAVA_ENCRYPTION_KEY) {
            throw new Error('Server misconfiguration: Missing encryption key')
        }

        console.log("Fetching Strava tokens...")
        const { data: tokens, error: tokenError } = await supabase.rpc('get_strava_tokens', {
            p_user_id: userId,
            p_encryption_key: STRAVA_ENCRYPTION_KEY
        })

        if (tokenError) {
            console.error("Token RPC Error:", tokenError)
            throw new Error(`Database error fetching tokens: ${tokenError.message}`)
        }

        if (!tokens || tokens.length === 0) {
            throw new Error('Strava not connected: No tokens found for user')
        }

        let { access_token, refresh_token, expires_at } = tokens[0]

        // 3. Refresh Token if needed
        if (new Date(expires_at).getTime() < Date.now() + 300000) { // Refresh if expires in < 5 mins
            console.log("Refreshing Strava token...")
            const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID')
            const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET')

            const refreshRes = await fetch('https://www.strava.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: STRAVA_CLIENT_ID,
                    client_secret: STRAVA_CLIENT_SECRET,
                    grant_type: 'refresh_token',
                    refresh_token: refresh_token
                })
            })

            const refreshData = await refreshRes.json()
            if (!refreshRes.ok) {
                console.error("Strava Refresh Error:", refreshData)
                throw new Error(`Failed to refresh Strava token: ${refreshData.message || 'Unknown error'}`)
            }

            console.log("Saving new tokens...")
            const { error: saveError } = await supabase.rpc('save_strava_tokens', {
                p_user_id: userId,
                p_access_token: refreshData.access_token,
                p_refresh_token: refreshData.refresh_token,
                p_expires_at: new Date(refreshData.expires_at * 1000).toISOString(),
                p_encryption_key: STRAVA_ENCRYPTION_KEY
            })

            if (saveError) {
                console.error("Token Save Error:", saveError)
                throw new Error(`Failed to save refreshed tokens: ${saveError.message}`)
            }

            access_token = refreshData.access_token
        }

        // 4. Fetch Last 30 Days Activities
        console.log("Fetching activities from Strava...")
        const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
        const activitiesRes = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${thirtyDaysAgo}&per_page=50`, {
            headers: { Authorization: `Bearer ${access_token}` }
        })

        if (!activitiesRes.ok) {
            const errData = await activitiesRes.json()
            console.error("Strava API Error:", errData)
            throw new Error(`Failed to fetch from Strava: ${errData.message || activitiesRes.statusText}`)
        }
        const activities = await activitiesRes.json()
        console.log(`Found ${activities.length} activities to sync`)

        // 5. Save to DB
        let savedCount = 0
        for (const act of activities) {
            // Sanitize values to avoid NaN or undefined causing DB errors
            const distance = act.distance || 0
            const points = Math.round(distance / 1000 * 10) || 0

            const { error: upsertError } = await supabase.from('workout_metrics').upsert({
                user_id: userId,
                source_platform: 'strava',
                external_id: act.id.toString(),
                title: act.name,
                type: act.type,
                start_time: act.start_date,
                duration_seconds: act.moving_time,
                distance_meters: distance,
                calories: act.calories || act.kilojoules || 0,
                elevation_gain_meters: act.total_elevation_gain || 0,
                points: points,
                updated_at: new Date().toISOString()
            }, { onConflict: 'source_platform,external_id' })

            if (upsertError) {
                console.error(`Error saving activity ${act.id}:`, upsertError)
            } else {
                savedCount++
            }
        }

        console.log(`Sync completed. Saved ${savedCount} activities.`)
        return new Response(JSON.stringify({ synced: savedCount, message: `Synced ${savedCount} activities` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Function Error:", error)
        // Return 200 OK but with error field so client can read the body easily
        // The client throws 400s sometimes without giving access to body in some Supabase client versions/contexts
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
