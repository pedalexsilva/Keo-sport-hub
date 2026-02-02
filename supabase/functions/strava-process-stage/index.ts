import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { stage_id } = await req.json()
        if (!stage_id) throw new Error('Missing stage_id')

        // Env Vars
        const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID')
        const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET')
        const STRAVA_ENCRYPTION_KEY = Deno.env.get('STRAVA_ENCRYPTION_KEY')
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // 2. Fetch Stage Details
        const { data: stage, error: stageError } = await supabase
            .from('event_stages')
            .select('*')
            .eq('id', stage_id)
            .single()

        if (stageError || !stage) throw new Error('Stage not found')

        // 3. Fetch Event Participants
        const { data: participants, error: partError } = await supabase
            .from('event_participants')
            .select('user_id')
            .eq('event_id', stage.event_id)

        if (partError) throw new Error('Failed to fetch participants')

        const results = []

        // 4. Process Each Participant
        for (const p of participants) {
            try {
                // A. Get Tokens
                const { data: tokens, error: tokenError } = await supabase.rpc('get_strava_tokens', {
                    p_user_id: p.user_id,
                    p_encryption_key: STRAVA_ENCRYPTION_KEY
                })

                if (tokenError || !tokens || tokens.length === 0) {
                    console.log(`No tokens for user ${p.user_id}, skipping`)
                    continue;
                }

                let { access_token, refresh_token, expires_at } = tokens[0]

                // B. Refresh Token if needed
                if (new Date(expires_at).getTime() < Date.now()) {
                    console.log(`Refreshing token for user ${p.user_id}`)
                    const refreshRes = await fetch('https://www.strava.com/oauth/token', {
                        method: 'POST',
                        body: new URLSearchParams({
                            client_id: STRAVA_CLIENT_ID!,
                            client_secret: STRAVA_CLIENT_SECRET!,
                            grant_type: 'refresh_token',
                            refresh_token: refresh_token
                        })
                    })
                    const refreshData = await refreshRes.json()
                    if (!refreshRes.ok) {
                        console.error(`Failed to refresh token for ${p.user_id}`, refreshData)
                        continue;
                    }

                    access_token = refreshData.access_token
                    refresh_token = refreshData.refresh_token
                    expires_at = new Date(refreshData.expires_at * 1000).toISOString()

                    // Save new tokens
                    await supabase.rpc('save_strava_tokens', {
                        p_user_id: p.user_id,
                        p_access_token: access_token,
                        p_refresh_token: refresh_token,
                        p_expires_at: expires_at,
                        p_encryption_key: STRAVA_ENCRYPTION_KEY
                    })
                }

                // C. Find Activity on Stage Date
                const stageDate = new Date(stage.date)
                const after = Math.floor(stageDate.setHours(0, 0, 0, 0) / 1000)
                const before = Math.floor(stageDate.setHours(23, 59, 59, 999) / 1000)

                const activitiesRes = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&before=${before}`, {
                    headers: { 'Authorization': `Bearer ${access_token}` }
                })

                if (!activitiesRes.ok) continue;

                const activities = await activitiesRes.json()
                if (activities.length === 0) {
                    // Mark DNF? Or just skip? Let's skip for now, maybe mark DNF if explicitly requested
                    continue;
                }

                // Pick the longest activity if multiple? Or match by type?
                // For now, take the first one.
                const activitySummary = activities[0]

                // D. Fetch Detailed Activity (for Segments)
                const detailRes = await fetch(`https://www.strava.com/api/v3/activities/${activitySummary.id}?include_all_efforts=true`, {
                    headers: { 'Authorization': `Bearer ${access_token}` }
                })
                const detailActivity = await detailRes.json()

                // E. Calculate Metrics
                const elapsedTime = detailActivity.elapsed_time
                let mountainPoints = 0

                if (stage.mountain_segment_ids && stage.mountain_segment_ids.length > 0) {
                    const efforts = detailActivity.segment_efforts || []
                    const targetSegments = new Set(stage.mountain_segment_ids)

                    // Simple logic: 10 points for completing a mountain segment
                    // TODO: meaningful points based on rank or segment_points_map
                    for (const effort of efforts) {
                        if (targetSegments.has(effort.segment.id.toString())) {
                            mountainPoints += 10 // Default points
                        }
                    }
                }

                // F. Save Stage Result (PENDING)
                const { error: upsertError } = await supabase
                    .from('stage_results')
                    .upsert({
                        stage_id: stage_id,
                        user_id: p.user_id,
                        strava_activity_id: detailActivity.id.toString(),
                        elapsed_time_seconds: elapsedTime,
                        mountain_points: mountainPoints,
                        is_dnf: false,
                        status: 'pending', // FORCE PENDING for human review
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'stage_id, user_id' })

                if (upsertError) console.error(`Error saving result for ${p.user_id}`, upsertError)
                else results.push({ user_id: p.user_id, time: elapsedTime, points: mountainPoints })

            } catch (err) {
                console.error(`Error processing user ${p.user_id}:`, err)
            }
        }

        // 5. NO AUTOMATIC LEADERBOARD UPDATE
        // We now rely on the "Finalize" step in Google Sheets.

        return new Response(JSON.stringify({ 
            success: true, 
            processed: results.length,
            message: "Results synced as 'Pending'. Please review in Google Sheets."
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
