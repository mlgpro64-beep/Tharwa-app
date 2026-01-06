// Edge Function: Send Phone OTP
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createResponse, createErrorResponse } from '../_shared/auth.ts'
import { checkRateLimit, getRateLimitKey } from '../_shared/rate-limit.ts'

// SMS service (you'll need to implement this or use a service)
async function sendOtpSms(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement SMS sending via Authentica or similar service
  // For now, return success in dev mode
  const isDev = Deno.env.get('ENVIRONMENT') === 'development'
  if (isDev) {
    console.log(`[DEV] OTP Code for ${phone}: ${code}`)
    return { success: true }
  }
  
  // In production, call your SMS service
  // const AUTHENTICA_API_KEY = Deno.env.get('AUTHENTICA_API_KEY')
  // ... implement SMS sending
  
  return { success: false, error: 'SMS service not configured' }
}

function isValidSaudiPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  const patterns = [/^05\d{8}$/, /^5\d{8}$/, /^9665\d{8}$/, /^\+9665\d{8}$/]
  return patterns.some(p => p.test(cleaned))
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  if (cleaned.startsWith('+966')) cleaned = cleaned.substring(4)
  if (cleaned.startsWith('966')) cleaned = cleaned.substring(3)
  if (!cleaned.startsWith('05') && cleaned.startsWith('5')) cleaned = '0' + cleaned
  return cleaned
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

serve(async (req) => {
  // Handle CORS
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
    const { phone, type = 'login' } = await req.json()

    if (!phone) {
      return createErrorResponse('Phone number is required', 400)
    }

    // Validate Saudi phone number
    if (!isValidSaudiPhone(phone)) {
      return createErrorResponse('Please enter a valid Saudi phone number', 400)
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

    // For login type, verify user exists
    if (type === 'login') {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single()

      if (!existingUser) {
        return createErrorResponse('No account found with this phone number', 400)
      }
    }

    // For registration, check phone isn't already registered
    if (type === 'registration') {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single()

      if (existingUser) {
        return createErrorResponse('Phone number already registered', 400)
      }
    }

    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP in database (using email field for phone compatibility)
    const { error: otpError } = await supabase
      .from('otp_codes')
      .insert({
        email: normalizedPhone, // Using email field to store phone
        code,
        type: `phone_${type}`,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0
      })

    if (otpError) {
      console.error('OTP storage error:', otpError)
      return createErrorResponse('Failed to create OTP code', 500)
    }

    // Send SMS
    const smsResult = await sendOtpSms(phone, code)

    if (!smsResult.success) {
      const isDev = Deno.env.get('ENVIRONMENT') === 'development'
      
      if (isDev) {
        // In dev mode, return OTP code
        return createResponse({
          success: true,
          message: 'OTP sent successfully (dev mode)',
          devCode: code,
          warning: `SMS service not available: ${smsResult.error}. Use devCode: ${code} for testing.`,
          smsError: smsResult.error
        })
      }

      return createErrorResponse(
        `Failed to send verification code: ${smsResult.error}. Please try again or contact support.`,
        500
      )
    }

    const isDev = Deno.env.get('ENVIRONMENT') === 'development'
    return createResponse({
      success: true,
      message: 'OTP sent successfully',
      ...(isDev && { devCode: code })
    })

  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})











