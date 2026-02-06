import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') || 'https://keo-sports-hub.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { stage_id, results } = await req.json()

    if (!stage_id || !results || !Array.isArray(results)) {
      throw new Error('Invalid payload')
    }

    // Initialize Supabase Admin (needed to update results and trigger generic leaderboard update)
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Process Updates
    // 1. Process Updates
    // We cannot use UPSERT easily because we are missing 'user_id' which is required for new rows,
    // and even for updates, if we don't provide all PK columns or if the inference fails, it tries to Insert.
    // Since we have the unique PK 'id' (UUID) of the result row, we can just UPDATE by ID.
    // Supabase JS doesn't support bulk update with different values easily in one query without RPC.
    // So we loop. It's fine for small batches (<100).
    
    for (const r of results) {
        const { error: updateError } = await supabase
            .from('stage_results')
            .update({
                official_time_seconds: r.official_time_seconds,
                official_mountain_points: r.mountain_points,
                status: r.status,
                updated_at: new Date().toISOString()
            })
            .eq('id', r.result_id)
            .eq('stage_id', stage_id) // Safety check

        if (updateError) {
             console.error(`Failed to update result ${r.result_id}:`, updateError)
             throw updateError
        }
    } 

    // 2. Trigger Leaderboard Recalculation
    // Need to find event_id from stage_id
    const { data: stageData, error: stageError } = await supabase
        .from('event_stages')
        .select('event_id, name')
        .eq('id', stage_id)
        .single()

    if (stageError) throw stageError

    const { error: rpcError } = await supabase.rpc('update_event_leaderboard', {
        p_event_id: stageData.event_id
    })

    if (rpcError) throw rpcError

    // 3. Send Notifications for NEWLY Official Results
    // (Optimization: In a real app we might track who was NOT official before, 
    // but here we just notify everyone who is marked as official in this batch request)
    
    const notifications = results
    .filter((r: any) => r.status === 'official')
    .map((r: any) => {
        // We need user_id for notification. The payload only had result_id. 
        // This is a trade-off. We might need to fetch user_ids or rely on the fact 
        // that we are notifying a big list.
        // Let's Skip user id lookup for now to save time, OR simpler:
        // We won't send notifications via this batch loop efficiently without user_id.
        // Let's do a quick fetch of the updated rows to get user_ids.
        return null; 
    });

    // Fetch updated rows to confirm and get user_ids for notification
    const { data: updatedRows } = await supabase
        .from('stage_results')
        .select('user_id, status')
        .eq('stage_id', stage_id)
        .in('id', results.map((r:any) => r.result_id))

    if (updatedRows) {
        const notifs = updatedRows
            .filter(r => r.status === 'official')
            .map(r => ({
                user_id: r.user_id,
                title: 'Resultados Oficiais Publicados! 🏆',
                message: `Os resultados da etapa "${stageData.name}" já são oficiais. Consulta a classificação!`,
                type: 'stage_official',
                metadata: { stage_id: stage_id, event_id: stageData.event_id }
            }))
        
        await supabase.from('notifications').insert(notifs)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Finalize Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
