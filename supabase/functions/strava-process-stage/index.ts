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

        // 4. Process Participants (Parallel with Concurrency Limit)
        const CONCURRENCY_LIMIT = 5
        const queue = [...(participants || [])]
        const activePromises: Promise<void>[] = []
        
        const processParticipant = async (p: { user_id: string }) => {
            try {
                log(`Processing user ${p.user_id}...`)
                // A. Get Tokens
                const { data: tokens, error: tokenError } = await supabase.rpc('get_strava_tokens', {
                    p_user_id: p.user_id,
                    p_encryption_key: STRAVA_ENCRYPTION_KEY
                })

                if (tokenError || !tokens || tokens.length === 0) {
                    log(`-> No tokens for ${p.user_id}. Skipping.`)
                    return;
                }

                let { access_token, refresh_token, expires_at } = tokens[0]

                // B. Refresh Token if needed
                if (new Date(expires_at).getTime() < Date.now()) {
                    log(`-> Token expired for ${p.user_id}. Refreshing...`)
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
                        log(`-> Failed refresh for ${p.user_id}: ${JSON.stringify(refreshData)}`)
                        return;
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

                if (!activitiesRes.ok) {
                    log(`-> API error for ${p.user_id}: ${await activitiesRes.text()}`)
                    return;
                }

                const activities = await activitiesRes.json()
                
                if (activities.length === 0) {
                    log(`-> No activities for ${p.user_id}.`)
                    return;
                }

                const activitySummary = activities[0]

                // D. Fetch Detailed Activity
                const detailRes = await fetch(`https://www.strava.com/api/v3/activities/${activitySummary.id}?include_all_efforts=true`, {
                    headers: { 'Authorization': `Bearer ${access_token}` }
                })
                const detailActivity = await detailRes.json()

                // E. Metrics
                const elapsedTime = detailActivity.elapsed_time
                let mountainPoints = 0

                if (stage.mountain_segment_ids && stage.mountain_segment_ids.length > 0) {
                    const efforts = detailActivity.segment_efforts || []
                    const targetSegments = new Set(stage.mountain_segment_ids)
                    for (const effort of efforts) {
                        if (targetSegments.has(effort.segment.id.toString())) {
                            mountainPoints += 10
                        }
                    }
                }

                // F. Save Result (UPSERT)
                // Check if result already exists to preserve 'official' status if it was already set? 
                // Plan says: "Novos resultados ficarão marcados como 'Pendentes'". 
                // Existing logic forces 'pending'. We should probably respect existing status IF it exists, 
                // OR just upsert and let the user re-verify. 
                // For safety and per "Human-in-the-loop" design, we reset to 'pending' on new sync 
                // UNLESS we want to keep official ones.
                // Decision: For now, keep logic as is (force pending) or maybe Check? 
                // To keep it simple and safe: Reset to pending so admin sees something changed.
                
                const { error: upsertError } = await supabase
                    .from('stage_results')
                    .upsert({
                        stage_id: stage_id,
                        user_id: p.user_id,
                        strava_activity_id: detailActivity.id.toString(),
                        elapsed_time_seconds: elapsedTime,
                        mountain_points: mountainPoints,
                        is_dnf: false,
                        status: 'pending', 
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'stage_id, user_id' })

                if (upsertError) {
                    log(`-> DB Error ${p.user_id}: ${upsertError.message}`)
                } else {
                    results.push({ user_id: p.user_id, time: elapsedTime })
                    log(`-> Saved ${p.user_id}: ${formatDuration(elapsedTime)}`)
                }

            } catch (err) {
                log(`Error ${p.user_id}: ${err.message}`)
            }
        }
    
        // Helper for formatting logs
        function formatDuration(s: number) { return new Date(s * 1000).toISOString().substr(11, 8) }

        // Execute Queue
        while (queue.length > 0) {
            if (activePromises.length >= CONCURRENCY_LIMIT) {
                await Promise.race(activePromises)
            }
            const p = queue.shift()
            if (p) {
                const promise = processParticipant(p).then(() => {
                    activePromises.splice(activePromises.indexOf(promise), 1)
                })
                activePromises.push(promise)
            }
        }
        await Promise.all(activePromises)

        return new Response(JSON.stringify({ 
            success: true, 
            processed: results.length,
            message: `Sync complete. ${results.length} participants processed.`,
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
