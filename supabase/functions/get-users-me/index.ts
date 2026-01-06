// Edge Function: Get Current User
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCurrentUser, createResponse, createErrorResponse } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    })
  }

  try {
    const user = await getCurrentUser(req)
    
    if (!user) {
      return createErrorResponse('Not authenticated', 401)
    }

    return createResponse({
      success: true,
      user
    })

  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})











