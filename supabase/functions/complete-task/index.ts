// Edge Function: Complete Task
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCurrentUser, createResponse, createErrorResponse } from '../_shared/auth.ts'

const PLATFORM_FEE_PERCENTAGE = 0.05

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
    const taskId = url.pathname.split('/').pop()
    
    if (!taskId) {
      return createErrorResponse('Task ID is required', 400)
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

    // Check authorization - only client or assigned tasker can complete
    if (task.client_id !== user.id && task.tasker_id !== user.id) {
      return createErrorResponse('Not authorized', 403)
    }

    // Check task status
    if (task.status !== 'assigned' && task.status !== 'in_progress') {
      return createErrorResponse('Task cannot be completed in current status', 400)
    }

    // Get accepted bid
    const { data: acceptedBid } = await supabase
      .from('bids')
      .select('*')
      .eq('task_id', taskId)
      .eq('status', 'accepted')
      .single()

    if (!acceptedBid) {
      return createErrorResponse('No accepted bid found for this task', 400)
    }

    const totalAmount = parseFloat(acceptedBid.amount)
    const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE
    const taskerPayout = totalAmount - platformFee

    // Start transaction
    const { data: clientUser } = await supabase
      .from('users')
      .select('balance')
      .eq('id', task.client_id)
      .single()

    const { data: taskerUser } = await supabase
      .from('users')
      .select('balance')
      .eq('id', task.tasker_id)
      .single()

    if (!clientUser || !taskerUser) {
      return createErrorResponse('User not found', 404)
    }

    const clientBalance = parseFloat(clientUser.balance || '0')
    const taskerBalance = parseFloat(taskerUser.balance || '0')

    // Check if client has enough balance
    if (clientBalance < totalAmount) {
      return createErrorResponse('Insufficient balance', 400)
    }

    // Update balances
    await supabase
      .from('users')
      .update({ balance: (clientBalance - totalAmount).toFixed(2) })
      .eq('id', task.client_id)

    await supabase
      .from('users')
      .update({ balance: (taskerBalance + taskerPayout).toFixed(2) })
      .eq('id', task.tasker_id)

    // Create transactions
    await supabase
      .from('transactions')
      .insert([
        {
          user_id: task.client_id,
          task_id: taskId,
          title: `دفع للمهمة: ${task.title}`,
          amount: totalAmount.toFixed(2),
          type: 'debit',
          status: 'completed',
          icon: 'account_balance_wallet'
        },
        {
          user_id: task.tasker_id,
          task_id: taskId,
          title: `دفع من المهمة: ${task.title}`,
          amount: taskerPayout.toFixed(2),
          type: 'credit',
          status: 'completed',
          icon: 'account_balance_wallet'
        }
      ])

    // Update task status
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Task update error:', updateError)
      return createErrorResponse('Failed to complete task', 500)
    }

    // Update tasker stats
    await supabase.rpc('increment_completed_tasks', { user_id: task.tasker_id })

    // Create notifications
    await supabase
      .from('notifications')
      .insert([
        {
          user_id: task.client_id,
          type: 'task_completed',
          title: 'تم إتمام المهمة',
          message: `تم إتمام المهمة "${task.title}"`,
          icon: 'check_circle',
          color: 'success',
          action_url: `/task/${taskId}`,
          read: false
        },
        {
          user_id: task.tasker_id,
          type: 'task_completed',
          title: 'تم إتمام المهمة',
          message: `تم إتمام المهمة "${task.title}" وتم تحويل ${taskerPayout.toFixed(2)} ريال إلى رصيدك`,
          icon: 'check_circle',
          color: 'success',
          action_url: `/task/${taskId}`,
          read: false
        }
      ])

    return createResponse({
      success: true,
      task: updatedTask
    })

  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})










