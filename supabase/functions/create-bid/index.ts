// Edge Function: Create Bid
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

    // Check if user is a tasker
    if (user.role !== 'tasker') {
      return createErrorResponse('Only taskers can create bids', 403)
    }

    const url = new URL(req.url)
    const taskId = url.pathname.split('/').pop() || url.searchParams.get('task_id')
    
    if (!taskId) {
      return createErrorResponse('Task ID is required', 400)
    }

    const { amount, message } = await req.json()

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return createErrorResponse('Valid bid amount is required', 400)
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

    // Check if task is open
    if (task.status !== 'open') {
      return createErrorResponse('Task is not open for bids', 400)
    }

    // Check if user already bid on this task
    const { data: existingBid } = await supabase
      .from('bids')
      .select('id')
      .eq('task_id', taskId)
      .eq('tasker_id', user.id)
      .single()

    if (existingBid) {
      return createErrorResponse('You have already bid on this task', 400)
    }

    // Create bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        task_id: taskId,
        tasker_id: user.id,
        amount: parseFloat(amount),
        message: message || null,
        status: 'pending'
      })
      .select()
      .single()

    if (bidError) {
      console.error('Bid creation error:', bidError)
      return createErrorResponse('Failed to create bid', 500)
    }

    // Get tasker info for notification
    const { data: tasker } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single()

    // Create notification for client
    await supabase
      .from('notifications')
      .insert({
        user_id: task.client_id,
        type: 'bid_received',
        title: 'عرض جديد على مهمتك',
        message: `قدم ${tasker?.name || 'منفذ'} عرضًا بقيمة ${amount} ريال على "${task.title}"`,
        icon: 'tag',
        color: 'accent',
        action_url: `/task/${taskId}`,
        read: false
      })

    return createResponse({
      success: true,
      bid
    })

  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})










