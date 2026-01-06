// Rate limiting utilities using Supabase database
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Call database function for rate limiting
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_max: maxRequests,
      p_window: windowMs
    })
    
    if (error) {
      console.error('Rate limit error:', error)
      // Allow request if rate limit check fails
      return { allowed: true, remaining: maxRequests, resetIn: windowMs }
    }
    
    return data as RateLimitResult
  } catch (error) {
    console.error('Rate limit exception:', error)
    // Allow request if rate limit check fails
    return { allowed: true, remaining: maxRequests, resetIn: windowMs }
  }
}

export function getRateLimitKey(req: Request, prefix: string): string {
  const authHeader = req.headers.get('Authorization')
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    // Use first 8 chars of token as identifier
    return `${prefix}:${token.substring(0, 8)}`
  }
  
  return `${prefix}:${ip}`
}











