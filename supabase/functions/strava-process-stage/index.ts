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

        const logs: string[] = []
        function log(msg: string) {
            console.log(msg)
            logs.push(msg)
        }

        log(`Starting process for stage_id: ${stage_id}`)

        // 2. Fetch Stage Details
        const { data: stage, error: stageError } = await supabase
            .from('event_stages')
            .select('*')
            .eq('id', stage_id)
            .single()

        if (stageError || !stage) {
            log(`Error fetching stage: ${stageError?.message}`)
            throw new Error('Stage not found')
        }
        log(`Found stage: ${stage.name} on ${stage.date}`)

        // 3. Fetch Event Participants
        const { data: participants, error: partError } = await supabase
            .from('event_participants')
            .select('user_id')
            .eq('event_id', stage.event_id)

        if (partError) {
             log(`Error fetching participants: ${partError.message}`)
             throw new Error('Failed to fetch participants')
        }
        log(`Found ${participants?.length || 0} participants`)

        const results = []

        // 4. Process Each Participant
        for (const p of participants || []) {
            try {
                log(`Processing user ${p.user_id}...`)
                // A. Get Tokens
                const { data: tokens, error: tokenError } = await supabase.rpc('get_strava_tokens', {
                    p_user_id: p.user_id,
                    p_encryption_key: STRAVA_ENCRYPTION_KEY
                })

                if (tokenError || !tokens || tokens.length === 0) {
                    log(`-> No tokens found (or RPC error: ${tokenError?.message}). Skipping.`)
                    continue;
                }

                let { access_token, refresh_token, expires_at } = tokens[0]

                // B. Refresh Token if needed
                if (new Date(expires_at).getTime() < Date.now()) {
                    log(`-> Token expired at ${expires_at}. Refreshing...`)
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
                        log(`-> Failed to refresh token: ${JSON.stringify(refreshData)}`)
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
                    log(`-> Token refreshed successfully.`)
                }

                // C. Find Activity on Stage Date
                // Important: Set time to 00:00:00 and 23:59:59 of the stage date
                // Note: 'date' in DB is YYYY-MM-DD string. new Date('YYYY-MM-DD') assumes UTC usually.
                const stageDate = new Date(stage.date)
                const after = Math.floor(stageDate.setHours(0, 0, 0, 0) / 1000)
                const before = Math.floor(stageDate.setHours(23, 59, 59, 999) / 1000)
                
                log(`-> Fetching activities between ${after} (00:00) and ${before} (23:59)`)

                const activitiesRes = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&before=${before}`, {
                    headers: { 'Authorization': `Bearer ${access_token}` }
                })

                if (!activitiesRes.ok) {
                    log(`-> Strava API error: ${activitiesRes.status} ${await activitiesRes.text()}`)
                    continue;
                }

                const activities = await activitiesRes.json()
                log(`-> Found ${activities.length} activities.`)
                
                if (activities.length === 0) {
                    log(`-> No matching activities found in time window.`)
                    continue;
                }

                // Pick the longest activity if multiple? Or match by type?
                // For now, take the first one.
                const activitySummary = activities[0]
                log(`-> Selected activity: ${activitySummary.id} (${activitySummary.name})`)

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

                if (upsertError) {
                    log(`-> Error saving result: ${upsertError.message}`)
                } else {
                    results.push({ user_id: p.user_id, time: elapsedTime, points: mountainPoints })
                    log(`-> Result saved successfully.`)
                }

            } catch (err) {
                log(`Error processing user ${p.user_id}: ${err.message}`)
            }
        }

        // 5. NO AUTOMATIC LEADERBOARD UPDATE
        // We now rely on the "Finalize" step in Google Sheets.

        return new Response(JSON.stringify({ 
            success: true, 
            processed: results.length,
            message: "Results synced as 'Pending'. Please review in Google Sheets.",
            logs: logs 
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
