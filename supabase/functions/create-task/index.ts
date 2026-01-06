// Edge Function: Create Task
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
    // Check authentication
    const user = await getCurrentUser(req)
    if (!user) {
      return createErrorResponse('Not authenticated', 401)
    }

    // Check if user is a client
    if (user.role !== 'client') {
      return createErrorResponse('Only clients can create tasks', 403)
    }

    const taskData = await req.json()
    const { title, description, category, budget, location, latitude, longitude, date, time, is_scheduled, scheduled_date_time, images } = taskData

    // Validate required fields
    if (!title || !description || !category || !budget || !location) {
      return createErrorResponse('Title, description, category, budget, and location are required', 400)
    }

    // Check daily task limit (5 tasks per day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    if ((count || 0) >= 5) {
      return createErrorResponse('You have reached the daily task limit (5 tasks per day)', 400)
    }

    // Create task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        client_id: user.id,
        title,
        description,
        category,
        budget: parseFloat(budget),
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        date: date || null,
        time: time || null,
        is_scheduled: is_scheduled || false,
        scheduled_date_time: scheduled_date_time || null,
        images: images || [],
        status: 'open'
      })
      .select()
      .single()

    if (error) {
      console.error('Task creation error:', error)
      return createErrorResponse('Failed to create task', 500)
    }

    return createResponse({
      success: true,
      task
    })

  } catch (error) {
    console.error('Error:', error)
    return createErrorResponse(error instanceof Error ? error.message : 'Internal server error', 500)
  }
})











