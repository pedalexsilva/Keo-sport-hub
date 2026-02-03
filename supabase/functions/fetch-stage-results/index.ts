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
    
    // HARD FIX: Ignore incoming Auth Header for now to prevent JWT errors.
    // We force Public/Anon access.
    const authHeader = null 
    
    /* 
    // Previous Code (Commented out):
    let authHeader = req.headers.get('Authorization')
    if (authHeader && (...)) { authHeader = null }
    */

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      // authHeader is forced to null, so this third arg is always undefined
      undefined 
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

    // 2. Fetch Results (without join first to avoid schema errors)
    let { data: rawResults, error: resultsError } = await supabase
        .from('stage_results')
        .select('*')
        .eq('stage_id', stageId)
        .order('elapsed_time_seconds', { ascending: true })

    if (resultsError) throw resultsError



    // 3. Manually fetch profiles for these results
    const userIds = rawResults.map(r => r.user_id)
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, office')
        .in('id', userIds)

    if (profilesError) throw profilesError

    // 4. Merge profiles into results
    const results = rawResults.map(r => {
        const profile = profiles.find(p => p.id === r.user_id)
        return {
            ...r,
            user: profile ? { full_name: profile.full_name, office: profile.office } : { full_name: 'Unknown', office: '' }
        }
    })

    if (resultsError) throw resultsError

    return new Response(JSON.stringify({
        meta: {
            stage_name: stageData.name,
            event_title: stageData.event.title
        },
        results: results,
        debug_info: {

        }
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
