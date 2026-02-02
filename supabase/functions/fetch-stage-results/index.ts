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
    const url = new URL(req.url)
    const stageId = url.searchParams.get('stage_id')

    if (!stageId) {
      throw new Error('Missing stage_id parameter')
    }

    // Initialize Supabase Client
    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    let authHeader = req.headers.get('Authorization')

    console.log(`[Debug] Incoming Auth Header: '${authHeader}'`)

    // Validate Auth Header: Ignore if explicitly 'null', 'undefined', or just 'Bearer '
    if (authHeader && (
        authHeader.trim() === 'Bearer' || 
        authHeader.includes('null') || 
        authHeader.includes('undefined') ||
        authHeader.length < 20 // Basic sanity check for JWT length
    )) {
      console.log('[Debug] Invalid Auth Header detected. Falling back to Anon Key.')
      authHeader = null
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
    )

    // 1. Fetch Stage & Event Details
    const { data: stageData, error: stageError } = await supabase
        .from('event_stages')
        .select(`
            name,
            event:events(title)
        `)
        .eq('id', stageId)
        .single()
    
    if (stageError) throw stageError

    // 2. Fetch Results with User Profile
    const { data: results, error: resultsError } = await supabase
        .from('stage_results')
        .select(`
            *,
            user:profiles(full_name, office)
        `)
        .eq('stage_id', stageId)
        .order('elapsed_time_seconds', { ascending: true })

    if (resultsError) throw resultsError

    return new Response(JSON.stringify({
        meta: {
            stage_name: stageData.name,
            event_title: stageData.event.title
        },
        results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
