// Follow this guide: https://supabase.com/docs/guides/functions
// 1. supabase functions new strava-auth
// 2. Paste this code into index.ts
// 3. supabase secrets set STRAVA_CLIENT_ID=... STRAVA_CLIENT_SECRET=...
// 4. supabase functions deploy strava-auth

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { code, redirect_uri } = await req.json()

        const client_id = Deno.env.get('STRAVA_CLIENT_ID')
        const client_secret = Deno.env.get('STRAVA_CLIENT_SECRET')

        if (!client_id || !client_secret) {
            throw new Error('Missing environment variables')
        }

        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id,
                client_secret,
                code,
                grant_type: 'authorization_code',
                redirect_uri
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
