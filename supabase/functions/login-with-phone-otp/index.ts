// Edge Function: Login with Phone OTP
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createResponse, createErrorResponse } from '../_shared/auth.ts'
import { checkRateLimit, getRateLimitKey } from '../_shared/rate-limit.ts'

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  if (cleaned.startsWith('+966')) cleaned = cleaned.substring(4)
  if (cleaned.startsWith('966')) cleaned = cleaned.substring(3)
  if (!cleaned.startsWith('05') && cleaned.startsWith('5')) cleaned = '0' + cleaned
  return cleaned
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    })
  }

  try {
    const { phone, otpCode } = await req.json()

    if (!phone || !otpCode) {
      return createErrorResponse('Phone and OTP code are required', 400)
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, 'login')
    const rateLimitResult = await checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)
    
    if (!rateLimitResult.allowed) {
      return createResponse({
        error: `تم تجاوز الحد الأقصى للطلبات. حاول مرة أخرى بعد ${Math.ceil(rateLimitResult.resetIn / 1000)} ثانية`,
        retryAfter: Math.ceil(rateLimitResult.resetIn / 1000)
      }, 429)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const normalizedPhone = normalizePhone(phone)

    // Verify OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', normalizedPhone)
      .eq('code', otpCode)
      .eq('type', 'phone_login')
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      return createErrorResponse('Invalid or expired OTP', 400)
    }

    // Get user by phone
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', normalizedPhone)
      .single()

    if (userError || !user) {
      return createErrorResponse('No account found with this phone number', 400)
    }

    // Mark OTP as verified
    await supabase
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', otpRecord.id)

    // Create Supabase Auth session
    // Note: In production, you might want to create a custom JWT token
    // For now, we'll return user data and let frontend handle auth
    
    // Remove password from user object
    const { password, ...safeUser } = user

    // Create session token (you can use Supabase Auth here)
    // For now, return user data
    return createResponse({
      success: true,
      user: safeUser,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})











