import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') || 'https://keo-sports-hub.vercel.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (req.method !== 'POST') {
            throw new Error('Method not allowed')
        }

        let body;
        try {
            body = await req.json()
        } catch (e) {
            console.error("JSON Parse Error:", e);
            throw new Error('Invalid JSON body')
        }

        const { code, type } = body

        // Environment Variables
        const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID')
        const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET')
        const STRAVA_ENCRYPTION_KEY = Deno.env.get('STRAVA_ENCRYPTION_KEY')
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_ENCRYPTION_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing Env Vars: ", {
                hasClientId: !!STRAVA_CLIENT_ID,
                hasClientSecret: !!STRAVA_CLIENT_SECRET,
                hasEncryptionKey: !!STRAVA_ENCRYPTION_KEY,
                hasSupabaseUrl: !!SUPABASE_URL,
                hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
            })
            // Return 500 for server config error
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Initialize Admin Client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // ==============================================================================
        // ACTION: AUTHORIZE (Generate URL with Secure State)
        // ==============================================================================
        if (type === 'authorize_url') {
            // Get optional return URL from request body
            const { return_url } = body;
            
            // Create state object with both random UUID and return URL
            const stateData = {
                uuid: crypto.randomUUID(),
                return_url: return_url || '/app/profile' // default fallback
            };
            
            // Encode state as base64
            const state = btoa(JSON.stringify(stateData));

            const redirectUri = `${req.headers.get('origin')}/strava/callback`
            const scope = 'read,activity:read_all,profile:read_all'
            
            const params = new URLSearchParams({
                client_id: STRAVA_CLIENT_ID,
                response_type: 'code',
                redirect_uri: redirectUri,
                approval_prompt: 'force',
                scope: scope,
                state: state
            })

            const url = `https://www.strava.com/oauth/authorize?${params.toString()}`

            console.log('Generated Auth URL with redirect:', redirectUri) // Debug log
            console.log('State contains return_url:', return_url) // Debug log

            return new Response(JSON.stringify({ url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }


        // ==============================================================================
        // ACTION: EXCHANGE (Code -> Token)
        // ==============================================================================
        if (code) {
            // A. Post to Strava
            const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: STRAVA_CLIENT_ID,
                    client_secret: STRAVA_CLIENT_SECRET,
                    code,
                    grant_type: 'authorization_code',
                }),
            })

            const tokenData = await tokenResponse.json()

            if (!tokenResponse.ok) {
                console.error("Strava Error:", tokenData)
                throw new Error(tokenData.message || 'Failed to exchange token with Strava')
            }

            // B. Get User ID securely
            const authHeader = req.headers.get('Authorization')
            let userId = null
            if (authHeader) {
                const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
                if (user) userId = user.id
            }

            if (!userId) {
                throw new Error('Unauthorized: No valid session')
            }

            // C. Save to DB (Encrypted)
            const { error: rpcError } = await supabase.rpc('save_strava_tokens', {
                p_user_id: userId,
                p_access_token: tokenData.access_token,
                p_refresh_token: tokenData.refresh_token,
                p_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
                p_encryption_key: STRAVA_ENCRYPTION_KEY
            })

            if (rpcError) {
                console.error("RPC Error:", rpcError)
                throw new Error('Failed to save secure tokens')
            }

            // D. Register Connection
            const athleteId = tokenData.athlete?.id
            if (athleteId) {
                await supabase.rpc('update_device_connection', {
                    p_user_id: userId,
                    p_platform: 'strava',
                    p_provider_user_id: athleteId.toString(),
                    p_is_active: true
                })
            }

            return new Response(JSON.stringify({ success: true, athlete: tokenData.athlete }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        throw new Error('Invalid Request: Missing code or type')

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
