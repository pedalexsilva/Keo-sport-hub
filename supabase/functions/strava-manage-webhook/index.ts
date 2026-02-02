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
        // 1. Env Vars
        const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID')
        const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET')
        const STRAVA_WEBHOOK_VERIFY_TOKEN = Deno.env.get('STRAVA_WEBHOOK_VERIFY_TOKEN')

        // This function's URL is used to derive the webhook URL
        // req.url = https://project.supabase.co/functions/v1/strava-manage-webhook
        const currentUrl = new URL(req.url)
        // FORCE HTTPS: Strava strictly requires https. Edge Functions might report http behind proxy.
        const baseUrl = `https://${currentUrl.host}/functions/v1`
        const webhookUrl = `${baseUrl}/strava-webhook`

        if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_WEBHOOK_VERIFY_TOKEN) {
            throw new Error("Missing required environment variables (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_WEBHOOK_VERIFY_TOKEN)")
        }

        // 2. Check current subscriptions
        const checkRes = await fetch(`https://www.strava.com/api/v3/push_subscriptions?client_id=${STRAVA_CLIENT_ID}&client_secret=${STRAVA_CLIENT_SECRET}`)
        if (!checkRes.ok) {
            throw new Error(`Failed to check subscriptions: ${await checkRes.text()}`)
        }
        const currentSubs = await checkRes.json()

        const body = await req.json().catch(() => ({}))
        const action = body.action || 'view'

        // ACTION: DELETE (Cleanup)
        if (action === 'delete') {
            if (currentSubs.length === 0) {
                return new Response(JSON.stringify({ message: "No subscriptions to delete." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            const subId = currentSubs[0].id
            const delRes = await fetch(`https://www.strava.com/api/v3/push_subscriptions/${subId}?client_id=${STRAVA_CLIENT_ID}&client_secret=${STRAVA_CLIENT_SECRET}`, {
                method: 'DELETE'
            })
            if (!delRes.ok) throw new Error("Failed to delete subscription")

            return new Response(JSON.stringify({ success: true, message: `Deleted subscription ${subId}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ACTION: CREATE (Register)
        if (action === 'create') {
            if (currentSubs.length > 0) {
                 return new Response(JSON.stringify({ 
                     success: false, 
                     message: "Subscription already exists. Delete it first if you want to update it.", 
                     current: currentSubs 
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // Verify Token: Use override from body OR env var
            const verifyTokenToUse = body.verify_token || STRAVA_WEBHOOK_VERIFY_TOKEN;

            console.log(`Registering webhook: ${webhookUrl} with token: ${verifyTokenToUse}`)

            // Use URLSearchParams for x-www-form-urlencoded (standard for Strava)
            const params = new URLSearchParams();
            params.append('client_id', STRAVA_CLIENT_ID);
            params.append('client_secret', STRAVA_CLIENT_SECRET);
            params.append('callback_url', webhookUrl);
            params.append('verify_token', verifyTokenToUse);

            const createRes = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
                method: 'POST',
                body: params
            })

            const createData = await createRes.json()
            if (!createRes.ok) {
                throw new Error(`Failed to register: ${JSON.stringify(createData)}`)
            }

            return new Response(JSON.stringify({ success: true, data: createData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ACTION: VALIDATE (Self-Test)
        if (action === 'validate') {
             // Verify Token: Use override from body OR env var
             const verifyTokenToUse = body.verify_token || STRAVA_WEBHOOK_VERIFY_TOKEN;
             const challenge = 'self-test-challenge';
             
             const validateUrl = `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${verifyTokenToUse}&hub.challenge=${challenge}`
             
             console.log(`Validating webhook internally: ${validateUrl}`)
             
             const valRes = await fetch(validateUrl)
             const valText = await valRes.text()
             
             return new Response(JSON.stringify({ 
                 success: valRes.ok, 
                 status: valRes.status,
                 response: valText, 
                 url_used: validateUrl,
                 token_used: verifyTokenToUse
            }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            })
        }

        // DEFAULT: VIEW
        return new Response(JSON.stringify({
            status: "ok",
            strava_config: {
                client_id_set: !!STRAVA_CLIENT_ID,
                verify_token_set: !!STRAVA_WEBHOOK_VERIFY_TOKEN,
                derived_callback_url: webhookUrl
            },
            current_subscriptions: currentSubs
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
