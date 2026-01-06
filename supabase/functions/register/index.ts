// Edge Function: Register User
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createResponse, createErrorResponse } from '../_shared/auth.ts'

// Hash password using Web Crypto API (available in Deno)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  // For bcrypt compatibility, we'll use a simple hash for now
  // In production, use bcrypt library or Supabase Auth
  return hashHex
}

function normalizePhone(phone: string): string {
  if (!phone) return ''
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
    const { username, email, password, name, role, taskerType, certificateUrl, phone, otpCode } = await req.json()

    // Validate username
    if (!username || typeof username !== 'string' || !username.trim()) {
      return createErrorResponse('اسم المستخدم مطلوب', 400)
    }

    if (username.trim().length < 3 || username.trim().length > 20) {
      return createErrorResponse('اسم المستخدم يجب أن يكون بين 3-20 حرف', 400)
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return createErrorResponse('اسم المستخدم يمكن أن يحتوي على أحرف إنجليزية وأرقام و_ فقط', 400)
    }

    if (!password || password.length < 6) {
      return createErrorResponse('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if username exists
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .single()

    if (existingUsername) {
      return createErrorResponse('اسم المستخدم مسجل مسبقاً', 400)
    }

    // Check if email exists
    if (email) {
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingEmail) {
        return createErrorResponse('البريد الإلكتروني مسجل مسبقاً', 400)
      }
    }

    // Check if phone exists
    if (phone) {
      const normalizedPhone = normalizePhone(phone)
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single()

      if (existingPhone) {
        return createErrorResponse('رقم الجوال مسجل مسبقاً', 400)
      }
    }

    // Verify OTP if provided
    if (otpCode && email) {
      const normalizedPhone = phone ? normalizePhone(phone) : email
      const { data: otpRecord } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', normalizedPhone)
        .eq('code', otpCode)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!otpRecord) {
        return createErrorResponse('Invalid or expired OTP', 400)
      }

      // Mark OTP as verified
      await supabase
        .from('otp_codes')
        .update({ verified: true })
        .eq('id', otpRecord.id)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Prepare user data
    const userData: any = {
      username: username.trim(),
      email: email || null,
      password: hashedPassword,
      name: name || username.trim(),
      phone: phone ? normalizePhone(phone) : null,
      role: role || 'client',
      email_verified: otpCode ? true : false
    }

    if (role === 'tasker') {
      const validTaskerType = taskerType === 'specialized' ? 'specialized' : 'general'
      userData.tasker_type = validTaskerType
      userData.verification_status = 'pending'

      if (validTaskerType === 'specialized' && certificateUrl) {
        // In production, upload to Supabase Storage instead of storing base64
        userData.certificate_url = certificateUrl
      }
    }

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (userError) {
      console.error('User creation error:', userError)
      return createErrorResponse('Failed to create user', 500)
    }

    // Remove password from response
    const { password: _, ...safeUser } = user

    // Create notification for tasker approval
    if (role === 'tasker') {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'system',
          title: 'تم استلام طلبك',
          message: taskerType === 'specialized'
            ? 'تم استلام طلبك للانضمام كمنفذ متخصص وسيتم مراجعته قريبًا'
            : 'تم استلام طلبك للانضمام كمنفذ وسيتم مراجعته قريبًا',
          icon: 'clock',
          color: 'warning',
          action_url: '/settings',
          read: false
        })
    }

    return createResponse({
      success: true,
      user: safeUser,
      message: 'Registration successful'
    })

  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})










