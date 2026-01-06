// Shared authentication utilities for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: 'client' | 'tasker'
  [key: string]: any
}

export async function getCurrentUser(req: Request): Promise<User | null> {
  try {
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
    
    // Get user from Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !authUser) {
      return null
    }
    
    // Get user from our users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    
    if (error || !user) {
      return null
    }
    
    // Remove password from user object
    const { password, ...safeUser } = user
    return safeUser as User
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export function createResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  })
}

export function createErrorResponse(message: string, status = 400): Response {
  return createResponse({ error: message }, status)
}











