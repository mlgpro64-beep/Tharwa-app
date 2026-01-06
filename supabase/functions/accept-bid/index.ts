// Edge Function: Accept Bid
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
    const bidId = url.pathname.split('/').pop()
    
    if (!bidId) {
      return createErrorResponse('Bid ID is required', 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .single()

    if (bidError || !bid) {
      return createErrorResponse('Bid not found', 404)
    }

    // Get task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', bid.task_id)
      .single()

    if (taskError || !task) {
      return createErrorResponse('Task not found', 404)
    }

    // Check authorization - only task client can accept bids
    if (task.client_id !== user.id) {
      return createErrorResponse('Not authorized', 403)
    }

    // Update bid status
    const { data: updatedBid, error: updateBidError } = await supabase
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', bidId)
      .select()
      .single()

    if (updateBidError) {
      console.error('Bid update error:', updateBidError)
      return createErrorResponse('Failed to accept bid', 500)
    }

    // Reject other bids for this task
    await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('task_id', bid.task_id)
      .neq('id', bidId)

    // Update task
    const { data: updatedTask, error: updateTaskError } = await supabase
      .from('tasks')
      .update({
        status: 'assigned',
        tasker_id: bid.tasker_id
      })
      .eq('id', bid.task_id)
      .select()
      .single()

    if (updateTaskError) {
      console.error('Task update error:', updateTaskError)
      return createErrorResponse('Failed to update task', 500)
    }

    // Notify tasker
    await supabase
      .from('notifications')
      .insert({
        user_id: bid.tasker_id,
        type: 'task_update',
        title: 'تم قبول عرضك',
        message: `تم قبول عرضك على المهمة "${task.title}"`,
        icon: 'check_circle',
        color: 'success',
        action_url: `/task/${bid.task_id}`,
        read: false
      })

    return createResponse({
      success: true,
      bid: updatedBid,
      task: updatedTask
    })

  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})










