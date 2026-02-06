
export const corsHeaders = {
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function getCorsHeaders(req: Request) {
  // Default allowed origins including local development
  const defaultOrigins = 'https://keo-sports-hub.vercel.app,http://localhost:3000,http://localhost:5173'
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? defaultOrigins).split(',')
  const origin = req.headers.get('origin')
  
  // If origin matches one of allowed origins, use it (dynamic CORS)
  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      ...corsHeaders
    }
  }
  
  // Also allow any localhost for development flexibility
  if (origin && origin.startsWith('http://localhost:')) {
    return {
      'Access-Control-Allow-Origin': origin,
      ...corsHeaders
    }
  }
  
  // Default to first allowed origin (production)
  return {
    'Access-Control-Allow-Origin': allowedOrigins[0],
    ...corsHeaders
  }
}
