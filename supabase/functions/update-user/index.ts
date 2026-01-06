// Edge Function: Update User
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCurrentUser, createResponse, createErrorResponse } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    })
  }

  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return createErrorResponse('Not authenticated', 401)
    }

    const updateData = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate username if provided
    if (updateData.username !== undefined) {
      if (!updateData.username || typeof updateData.username !== 'string' || updateData.username.trim().length < 3 || updateData.username.trim().length > 20) {
        return createErrorResponse('اسم المستخدم يجب أن يكون بين 3-20 حرف', 400)
      }

      if (!/^[a-zA-Z0-9_]+$/.test(updateData.username.trim())) {
        return createErrorResponse('اسم المستخدم يمكن أن يحتوي على أحرف إنجليزية وأرقام و_ فقط', 400)
      }

      // Check if username is already taken by another user
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', updateData.username.trim())
        .neq('id', user.id)
        .single()

      if (existingUser) {
        return createErrorResponse('اسم المستخدم مسجل مسبقاً', 400)
      }

      updateData.username = updateData.username.trim()
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('User update error:', updateError)
      return createErrorResponse('Failed to update user', 500)
    }

    // Remove password from response
    const { password, ...safeUser } = updatedUser

    return createResponse({
      success: true,
      user: safeUser
    })

  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})










