import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') || 'https://keo-sports-hub.vercel.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { segment_id } = await req.json()
        if (!segment_id) throw new Error('Missing segment_id')

        // Get env vars
        const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID')
        const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET')
        const STRAVA_ENCRYPTION_KEY = Deno.env.get('STRAVA_ENCRYPTION_KEY')
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        // Create client with service role for database operations
        const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        
        // Create client with anon key for user verification
        const supabaseAuth = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)

        // Get auth header to find which user is making the request
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.log('No authorization header found')
            throw new Error('No authorization header')
        }

        const token = authHeader.replace('Bearer ', '')
        console.log('Token received, length:', token.length)

        // Get user from JWT using auth client
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token)

        if (userError) {
            console.log('User error:', userError.message)
            throw new Error('Authentication failed: ' + userError.message)
        }
        
        if (!user) {
            console.log('No user found for token')
            throw new Error('Invalid token - no user found')
        }
        
        console.log('User authenticated:', user.id)

        // Get user's Strava tokens using admin client
        const { data: tokens, error: tokenError } = await supabaseAdmin.rpc('get_strava_tokens', {
            p_user_id: user.id,
            p_encryption_key: STRAVA_ENCRYPTION_KEY
        })

        if (tokenError || !tokens || tokens.length === 0) {
            console.log('Token error:', tokenError?.message)
            throw new Error('No Strava connection. Please connect your Strava account first.')
        }

        let { access_token, refresh_token, expires_at } = tokens[0]

        // Refresh token if expired
        if (new Date(expires_at).getTime() < Date.now()) {
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
                throw new Error('Failed to refresh Strava token')
            }

            access_token = refreshData.access_token
            refresh_token = refreshData.refresh_token
            expires_at = new Date(refreshData.expires_at * 1000).toISOString()

            // Save new tokens
            await supabaseAdmin.rpc('save_strava_tokens', {
                p_user_id: user.id,
                p_access_token: access_token,
                p_refresh_token: refresh_token,
                p_expires_at: expires_at,
                p_encryption_key: STRAVA_ENCRYPTION_KEY
            })
        }

        // Fetch segment details from Strava
        const segmentRes = await fetch(`https://www.strava.com/api/v3/segments/${segment_id}`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        })

        if (!segmentRes.ok) {
            const errorData = await segmentRes.json()
            throw new Error(errorData.message || 'Failed to fetch segment from Strava')
        }

        const segment = await segmentRes.json()

        // Determine category based on climb_category (Strava uses 0-5, where 5 = HC)
        let category = 'cat4'
        if (segment.climb_category !== undefined) {
            switch (segment.climb_category) {
                case 5: category = 'hc'; break
                case 4: category = 'cat1'; break
                case 3: category = 'cat2'; break
                case 2: category = 'cat3'; break
                case 1: category = 'cat4'; break
                default: category = 'cat4'
            }
        }

        return new Response(JSON.stringify({
            success: true,
            segment: {
                id: segment.id.toString(),
                name: segment.name,
                distance_meters: segment.distance,
                avg_grade_percent: segment.average_grade,
                elevation_high: segment.elevation_high,
                elevation_low: segment.elevation_low,
                total_elevation_gain: segment.total_elevation_gain,
                category: category,
                city: segment.city,
                state: segment.state,
                country: segment.country
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: (error as Error).message 
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
