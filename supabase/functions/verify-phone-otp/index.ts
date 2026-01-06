// Edge Function: Verify Phone OTP
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
    const { phone, otpCode, type = 'login' } = await req.json()

    if (!phone || !otpCode) {
      return createErrorResponse('Phone and OTP code are required', 400)
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, 'otp')
    const rateLimitResult = await checkRateLimit(rateLimitKey, 3, 5 * 60 * 1000)
    
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

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', normalizedPhone)
      .eq('code', otpCode)
      .eq('type', `phone_${type}`)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      // Increment attempts if OTP exists but is invalid
      const { data: existingOtp } = await supabase
        .from('otp_codes')
        .select('id, attempts')
        .eq('email', normalizedPhone)
        .eq('type', `phone_${type}`)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingOtp) {
        await supabase
          .from('otp_codes')
          .update({ attempts: (existingOtp.attempts || 0) + 1 })
          .eq('id', existingOtp.id)
      }

      return createErrorResponse('Invalid or expired OTP', 400)
    }

    // Mark OTP as verified
    await supabase
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', otpRecord.id)

    return createResponse({
      success: true,
      message: 'OTP verified successfully'
    })

  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})











