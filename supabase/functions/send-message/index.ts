// Edge Function: Send Message
// Note: This function creates the message in database
// Supabase Realtime will automatically broadcast it to subscribers
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCurrentUser, createResponse, createErrorResponse } from '../_shared/auth.ts'

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
    const user = await getCurrentUser(req)
    if (!user) {
      return createErrorResponse('Not authenticated', 401)
    }

    const url = new URL(req.url)
    const taskId = url.pathname.split('/').pop() || url.searchParams.get('task_id')
    
    if (!taskId) {
      return createErrorResponse('Task ID is required', 400)
    }

    const { content, receiver_id } = await req.json()

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return createErrorResponse('Message content is required', 400)
    }

    if (!receiver_id) {
      return createErrorResponse('Receiver ID is required', 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return createErrorResponse('Task not found', 404)
    }

    // Verify user is part of this task
    if (task.client_id !== user.id && task.tasker_id !== user.id) {
      return createErrorResponse('Not authorized to send messages for this task', 403)
    }

    // Verify receiver is part of this task
    if (receiver_id !== task.client_id && receiver_id !== task.tasker_id) {
      return createErrorResponse('Invalid receiver', 400)
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        task_id: taskId,
        sender_id: user.id,
        receiver_id: receiver_id,
        content: content.trim(),
        read: false
      })
      .select()
      .single()

    if (messageError) {
      console.error('Message creation error:', messageError)
      return createErrorResponse('Failed to send message', 500)
    }

    // Create notification for receiver
    await supabase
      .from('notifications')
      .insert({
        user_id: receiver_id,
        type: 'chat',
        title: 'رسالة جديدة',
        message: `رسالة جديدة من ${user.name} بخصوص "${task.title}"`,
        icon: 'message-circle',
        color: 'primary',
        action_url: `/chat/${taskId}`,
        read: false
      })

    // Supabase Realtime will automatically broadcast this message
    // to all subscribers of the task channel

    return createResponse({
      success: true,
      message
    })

  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})










