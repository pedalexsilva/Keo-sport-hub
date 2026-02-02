import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. GET Request: Subscription Validation (Hub Challenge)
    if (req.method === 'GET') {
        const url = new URL(req.url)
        const mode = url.searchParams.get('hub.mode')
        const token = url.searchParams.get('hub.verify_token')
        const challenge = url.searchParams.get('hub.challenge')

        const VERIFY_TOKEN = Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN') || 'STRAVA'

        console.log(`[Webhook Verify] Mode: ${mode}, Token: ${token}, Expected: ${VERIFY_TOKEN}`)

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED: Matches!')
            return new Response(JSON.stringify({ "hub.challenge": challenge }), {
                headers: { 'Content-Type': 'application/json' },
            })
        }
        
        console.error(`[Webhook Verify] FAILED. Token mismatch? ${token !== VERIFY_TOKEN}`)
        return new Response(JSON.stringify({ 
            error: 'Forbidden', 
            debug: { received: token, expected: VERIFY_TOKEN, match: token === VERIFY_TOKEN }
        }), { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    // 2. POST Request: Event Handling
    if (req.method === 'POST') {
        try {
            const payload = await req.json()
            console.log("Webhook Event:", payload)

            /* Example Payload:
            {
                "aspect_type": "create",
                "event_time": 1516126040,
                "object_id": 1360128421,
                "object_type": "activity",
                "owner_id": 134815,
                "subscription_id": 120475,
                "updates": {}
            }
            */

            const { aspect_type, object_id, owner_id, object_type } = payload

            // Initialize Supabase Admin
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL')!,
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            )

            // Handle 'create' or 'update' activity
            if (object_type === 'activity' && (aspect_type === 'create' || aspect_type === 'update')) {
                // 1. Find User by Strava Athlete ID (owner_id)
                const { data: connection, error: connError } = await supabase
                    .from('device_connections')
                    .select('user_id')
                    .eq('platform', 'strava')
                    .eq('provider_user_id', owner_id.toString())
                    .single()

                if (connError || !connection) {
                    console.log(`User not found for Strava ID: ${owner_id}`)
                    return new Response('OK', { status: 200 }) // Return OK to Strava anyway
                }

                const userId = connection.user_id

                // 2. Fetch Tokens to get Activity Details (need decryption)
                // Call get_strava_tokens RPC
                const { data: tokens, error: tokenError } = await supabase.rpc('get_strava_tokens', {
                    p_user_id: userId,
                    p_encryption_key: Deno.env.get('STRAVA_ENCRYPTION_KEY')!
                })

                if (tokenError || !tokens || tokens.length === 0) {
                    console.error("Could not retrieve tokens")
                    return new Response('OK', { status: 200 })
                }

                const accessToken = tokens[0].access_token

                // 3. Fetch Activity from Strava
                const stravaRes = await fetch(`https://www.strava.com/api/v3/activities/${object_id}?include_all_efforts=true`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })

                if (!stravaRes.ok) {
                    console.error("Failed to fetch activity from Strava")
                    return new Response('OK', { status: 200 })
                }

                const act = await stravaRes.json()

                // 4. Save to workout_metrics
                // Mapping and sanitization
                const distance = act.distance || 0
                const points = Math.round(distance / 1000 * 10) || 0

                const { error: saveError } = await supabase.from('workout_metrics').upsert({
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

                if (saveError) {
                    console.error("DB Save Error:", saveError)
                } else {
                    console.log(`Activity ${act.id} synced for user ${userId}`)
                }

                // =========================================================================
                // AUTOMATION: CHECK FOR STAGE MATCH (COMPETITIVE) OR SOCIAL EVENT
                // =========================================================================
                try {
                    const activityDate = new Date(act.start_date).toISOString().split('T')[0] // YYYY-MM-DD

                    // 1. Find matching stages
                    const { data: matchingStages, error: stageError } = await supabase
                        .from('event_stages')
                        .select('id, name, event_id, mountain_segment_ids')
                        .eq('date', activityDate)

                    if (!stageError && matchingStages && matchingStages.length > 0) {
                        console.log(`Found ${matchingStages.length} matching stages for date ${activityDate}`)

                        for (const stage of matchingStages) {
                            // Calculate elapsed time (moving_time)
                            const elapsedTime = act.moving_time;

                            // Calculate Mountain Points
                            let mountainPoints = 0;
                            if (stage.mountain_segment_ids && stage.mountain_segment_ids.length > 0) {
                                const efforts = act.segment_efforts || [];
                                for (const segmentId of stage.mountain_segment_ids) {
                                    const matchedEffort = efforts.find((e: any) => e.segment.id === segmentId);
                                    if (matchedEffort) {
                                        mountainPoints += 10; // Default 10 pts per segment
                                    }
                                }
                            }

                            // Upsert Result
                            const { error: resultError } = await supabase
                                .from('stage_results')
                                .upsert({
                                    stage_id: stage.id,
                                    user_id: userId,
                                    elapsed_time: elapsedTime,
                                    mountain_points: mountainPoints,
                                    strava_activity_id: act.id.toString(),
                                    status: 'pending' // Default to pending for review
                                }, { onConflict: 'stage_id, user_id' })

                            if (resultError) {
                                console.error('Error saving result:', resultError)
                            } else {
                                console.log(`Result saved as PENDING for ${stage.name}.`)
                                // REMOVED: Immediate Leaderboard Update
                                // REMOVED: Immediate Notification (moved to Finalize)
                            }
                        }
                    } else {
                        // 2. NO STAGE FOUND - CHECK FOR SOCIAL EVENTS
                        console.log(`No stages for ${activityDate}. Checking for SOCIAL events...`);
                        
                        const startOfDay = `${activityDate}T00:00:00`;
                        const endOfDay = `${activityDate}T23:59:59`;

                        const { data: socialEvents } = await supabase
                            .from('events')
                            .select('id, title')
                            .eq('mode', 'social')
                            .gte('date', startOfDay)
                            .lte('date', endOfDay);

                        if (socialEvents && socialEvents.length > 0) {
                            for (const event of socialEvents) {
                                console.log(`Processing Social Event: ${event.title}`);
                                
                                // NOTIFICATION (SOCIAL)
                                await supabase.from('notifications').insert({
                                    user_id: userId,
                                    title: 'Participação Detetada! 👋',
                                    message: `A tua atividade conta para o evento "${event.title}". Obrigado por participares!`,
                                    type: 'success', 
                                    metadata: {
                                        event_id: event.id,
                                        activity_id: act.id
                                    }
                                })
                            }
                        }
                    }
                } catch (autoError) {
                    console.error("Automation Logic Error:", autoError)
                }
            }

            // Handle 'delete'
            if (object_type === 'activity' && aspect_type === 'delete') {
                await supabase
                    .from('workout_metrics')
                    .delete()
                    .eq('source_platform', 'strava')
                    .eq('external_id', object_id.toString())
            }

            // Handle 'deauthorize' (revoke access)
            if (object_type === 'athlete' && aspect_type === 'update' && payload.updates?.authorized === 'false') {
                console.log(`Deauthorization event received for Strava User ID: ${owner_id}`)

                // 1. Find the user associated with this Strava ID
                const { data: connection } = await supabase
                    .from('device_connections')
                    .select('user_id')
                    .eq('platform', 'strava')
                    .eq('provider_user_id', owner_id.toString())
                    .single()

                if (connection) {
                    const userId = connection.user_id
                    console.log(`Cleaning up connection for User ID: ${userId}`)

                    // 2. Remove tokens
                    await supabase.from('strava_tokens').delete().eq('user_id', userId);

                    // 3. Mark connection inactive
                    await supabase.from('device_connections')
                        .update({ is_active: false })
                        .eq('user_id', userId)
                        .eq('platform', 'strava');
                } else {
                    console.log("No matching user found for deauthorization.")
                }
            }

            return new Response('EVENT_RECEIVED', {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        } catch (error) {
            console.error("Webhook Processing Error:", error)
            return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
    }
})
