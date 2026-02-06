import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StageSegment {
    id: string;
    strava_segment_id: string;
    name: string;
    points_scale: number[];
    category: string;
    segment_order: number;
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
        log(`Finish mode: ${stage.finish_mode || 'activity'}, Finish segment ID: ${stage.finish_segment_id || 'N/A'}`)

        // 3. Fetch Stage Segments (new system)
        const { data: segments, error: segmentsError } = await supabase
            .from('stage_segments')
            .select('*')
            .eq('stage_id', stage_id)
            .order('segment_order')

        if (segmentsError) {
            log(`Error fetching segments: ${segmentsError.message}`)
        }
        
        const stageSegments: StageSegment[] = segments || []
        log(`Found ${stageSegments.length} configured segments`)
        
        // Build set of Strava segment IDs to look for
        const targetSegmentIds = new Set<string>()
        
        // Add from new segment system
        stageSegments.forEach(s => targetSegmentIds.add(s.strava_segment_id))
        
        // Also add from legacy mountain_segment_ids for backward compatibility
        if (stage.mountain_segment_ids && stage.mountain_segment_ids.length > 0) {
            stage.mountain_segment_ids.forEach((id: string) => targetSegmentIds.add(id))
        }
        
        log(`Total target segments: ${targetSegmentIds.size}`)

        // 3b. Find the finish segment Strava ID if finish_mode is 'segment'
        let finishSegmentStravaId: string | null = null
        if (stage.finish_mode === 'segment' && stage.finish_segment_id) {
            const finishSeg = stageSegments.find(s => s.id === stage.finish_segment_id)
            if (finishSeg) {
                finishSegmentStravaId = finishSeg.strava_segment_id
                log(`Finish segment found: ${finishSeg.name} (Strava ID: ${finishSegmentStravaId})`)
            } else {
                log(`WARNING: Finish segment ID ${stage.finish_segment_id} not found in stage segments!`)
            }
        }

        // 4. Fetch Event Participants
        const { data: participants, error: partError } = await supabase
            .from('event_participants')
            .select('user_id')
            .eq('event_id', stage.event_id)

        if (partError) {
             log(`Error fetching participants: ${partError.message}`)
             throw new Error('Failed to fetch participants')
        }
        log(`Found ${participants?.length || 0} participants`)

        const results: any[] = []
        const segmentResults: any[] = []

        // 5. Process Participants (Parallel with Concurrency Limit)
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

                // Select the activity with the longest duration (moving_time or elapsed_time)
                const activitySummary = activities.reduce((longest: any, current: any) => {
                    const longestDuration = longest.moving_time || longest.elapsed_time || 0
                    const currentDuration = current.moving_time || current.elapsed_time || 0
                    return currentDuration > longestDuration ? current : longest
                }, activities[0])

                log(`-> Found ${activities.length} activities. Selected longest: ${activitySummary.name} (${activitySummary.moving_time || activitySummary.elapsed_time}s)`)

                // D. Fetch Detailed Activity (with segment efforts)
                const detailRes = await fetch(`https://www.strava.com/api/v3/activities/${activitySummary.id}?include_all_efforts=true`, {
                    headers: { 'Authorization': `Bearer ${access_token}` }
                })
                const detailActivity = await detailRes.json()

                const efforts = detailActivity.segment_efforts || []

                // E. Calculate elapsed time based on finish mode
                let elapsedTime: number | null = detailActivity.elapsed_time
                let is_dnf = false

                if (stage.finish_mode === 'segment' && finishSegmentStravaId) {
                    // Find the finish segment effort
                    const finishEffort = efforts.find(
                        (e: any) => e.segment.id.toString() === finishSegmentStravaId
                    )

                    if (finishEffort) {
                        // Calculate: (segment end time) - (activity start time)
                        const activityStart = new Date(detailActivity.start_date).getTime()
                        const effortStart = new Date(finishEffort.start_date).getTime()
                        const effortDuration = finishEffort.elapsed_time * 1000 // seconds to ms
                        const segmentEnd = effortStart + effortDuration

                        elapsedTime = Math.floor((segmentEnd - activityStart) / 1000)
                        log(`-> Segment finish mode: Activity start ${detailActivity.start_date}, Segment end ${new Date(segmentEnd).toISOString()}`)
                        log(`-> Calculated elapsed time: ${elapsedTime}s (vs activity time: ${detailActivity.elapsed_time}s)`)
                    } else {
                        // Athlete didn't pass the finish segment = DNF
                        log(`-> DNF: Athlete ${p.user_id} did not pass finish segment ${finishSegmentStravaId}`)
                        is_dnf = true
                        elapsedTime = null
                    }
                }

                let totalMountainPoints = 0

                // F. Process each configured segment (with support for multiple passes)
                // Group segments by strava_segment_id to handle multiple passes
                const segmentsByStravaId = new Map<string, StageSegment[]>()
                for (const segment of stageSegments) {
                    const key = segment.strava_segment_id
                    if (!segmentsByStravaId.has(key)) {
                        segmentsByStravaId.set(key, [])
                    }
                    segmentsByStravaId.get(key)!.push(segment)
                }

                // Process each unique Strava segment
                for (const [stravaSegmentId, configuredSegments] of segmentsByStravaId.entries()) {
                    // Sort configured segments by segment_order to match passes correctly
                    configuredSegments.sort((a, b) => a.segment_order - b.segment_order)
                    
                    // Find ALL efforts for this Strava segment (multiple passes)
                    const matchingEfforts = efforts
                        .filter((e: any) => e.segment.id.toString() === stravaSegmentId)
                        .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                    
                    log(`-> Found ${matchingEfforts.length} passes for segment ${stravaSegmentId} (${configuredSegments.length} configured)`)
                    
                    // Match each configured segment to the corresponding pass
                    for (let i = 0; i < configuredSegments.length; i++) {
                        const segment = configuredSegments[i]
                        const effort = matchingEfforts[i] // i-th pass for i-th configured segment
                        
                        if (effort) {
                            log(`-> Pass ${i + 1} for ${segment.name}: ${effort.elapsed_time}s (effort ${effort.id})`)
                            
                            // Save to segment_results
                            const { error: segmentUpsertError } = await supabase
                                .from('segment_results')
                                .upsert({
                                    stage_id: stage_id,
                                    segment_id: segment.id,
                                    user_id: p.user_id,
                                    strava_effort_id: effort.id.toString(),
                                    elapsed_time_seconds: effort.elapsed_time,
                                    status: 'pending',
                                    updated_at: new Date().toISOString()
                                }, { onConflict: 'segment_id, user_id' })

                            if (segmentUpsertError) {
                                log(`-> Segment result error: ${segmentUpsertError.message}`)
                            } else {
                                segmentResults.push({
                                    user_id: p.user_id,
                                    segment_name: segment.name,
                                    time: effort.elapsed_time
                                })
                            }
                        } else {
                            log(`-> No pass ${i + 1} found for segment ${segment.name}`)
                        }
                    }
                }

                // G. Calculate mountain points for legacy system (backward compatibility)
                if (targetSegmentIds.size > 0) {
                    for (const effort of efforts) {
                        if (targetSegmentIds.has(effort.segment.id.toString())) {
                            totalMountainPoints += 10 // Legacy fixed points
                        }
                    }
                }

                // H. Save Stage Result (for GC)
                const { error: upsertError } = await supabase
                    .from('stage_results')
                    .upsert({
                        stage_id: stage_id,
                        user_id: p.user_id,
                        strava_activity_id: detailActivity.id.toString(),
                        elapsed_time_seconds: elapsedTime,
                        mountain_points: totalMountainPoints,
                        is_dnf: is_dnf,
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
                log(`Error ${p.user_id}: ${(err as Error).message}`)
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

        // I. Calculate positions and points for segment_results
        log(`Calculating segment positions...`)
        for (const segment of stageSegments) {
            // Get all results for this segment, ordered by time
            const { data: segResults, error: segResultsError } = await supabase
                .from('segment_results')
                .select('id, elapsed_time_seconds')
                .eq('segment_id', segment.id)
                .order('elapsed_time_seconds', { ascending: true })

            if (segResultsError) {
                log(`-> Error fetching segment results: ${segResultsError.message}`)
                continue
            }

            // Update positions and points
            for (let i = 0; i < (segResults?.length || 0); i++) {
                const result = segResults![i]
                const points = segment.points_scale[i] || 0
                
                await supabase
                    .from('segment_results')
                    .update({
                        position: i + 1,
                        points_earned: points
                    })
                    .eq('id', result.id)
            }
            log(`-> Updated ${segResults?.length || 0} positions for ${segment.name}`)
        }

        // J. Aggregate points to stage_results (Fix for Custom Segments)
        log(`Aggregating segment points to stage results...`)
        
        // Fetch all segment results for this stage
        const { data: allSegResults, error: allSegResultsError } = await supabase
            .from('segment_results')
            .select('user_id, points_earned')
            .eq('stage_id', stage_id)
        
        if (!allSegResultsError && allSegResults) {
            // Sum points per user
            const userPointsMap = new Map<string, number>()
            
            allSegResults.forEach((r: any) => {
                const current = userPointsMap.get(r.user_id) || 0
                userPointsMap.set(r.user_id, current + (r.points_earned || 0))
            })
            
            // Update stage_results
            for (const [userId, points] of userPointsMap.entries()) {
                // If legacy points exist (from mountain_points), we should ideally replace or merge. 
                // The new system intends to replace legacy fixed points with calculated ones.
                // We will OVERWRITE mountain_points with the sum of segment points.
                
                await supabase
                    .from('stage_results')
                    .update({ 
                        mountain_points: points,
                        updated_at: new Date().toISOString()
                     })
                    .eq('stage_id', stage_id)
                    .eq('user_id', userId)
            }
            log(`-> Updated mountain points for ${userPointsMap.size} users.`)
        } else {
             log(`-> Error fetching total segment results: ${allSegResultsError?.message}`)
        }

        return new Response(JSON.stringify({ 
            success: true, 
            processed: results.length,
            segments_processed: segmentResults.length,
            message: `Sync complete. ${results.length} participants, ${segmentResults.length} segment efforts.`,
            logs: logs 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
