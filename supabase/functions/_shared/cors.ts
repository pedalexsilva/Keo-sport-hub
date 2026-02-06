
export const corsHeaders = {
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function getCorsHeaders(req: Request) {
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://keo-sports-hub.vercel.app').split(',')
  const origin = req.headers.get('origin')
  
  // If no origin (server-to-server), or if origin matches one of allowed, use it
  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      ...corsHeaders
    }
  }
  
  // Default to first allowed origin
  return {
    'Access-Control-Allow-Origin': allowedOrigins[0],
    ...corsHeaders
  }
}
