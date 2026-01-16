// Edge Function: Create Payment Link (Paylink Integration - Saudi Arabia)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCurrentUser, createResponse, createErrorResponse } from '../_shared/auth.ts'

// Paylink API endpoints
const PAYLINK_AUTH_URL = 'https://restapi.paylink.sa/api/auth'
const PAYLINK_INVOICE_URL = 'https://restapi.paylink.sa/api/addInvoice'

interface PaymentRequest {
  taskId: string
  amount: number
  clientPhone: string
  clientName?: string
  callBackUrl?: string
  cancelUrl?: string
}

interface PaylinkAuthResponse {
  id_token: string
}

interface PaylinkInvoiceResponse {
  gatewayOrderRequest: {
    url: string
    transactionNo: string
  }
  url: string
  transactionNo: string
}

/**
 * Step 1: Authenticate with Paylink API
 */
async function authenticatePaylink(): Promise<string> {
  const appId = Deno.env.get('PAYLINK_APP_ID')
  const secretKey = Deno.env.get('PAYLINK_SECRET_KEY')

  if (!appId || !secretKey) {
    throw new Error('Paylink credentials not configured')
  }

  const response = await fetch(PAYLINK_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiId: appId,
      secretKey: secretKey,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Paylink auth error:', errorText)
    throw new Error('Failed to authenticate with Paylink')
  }

  const data: PaylinkAuthResponse = await response.json()
  
  if (!data.id_token) {
    throw new Error('No id_token received from Paylink')
  }

  return data.id_token
}

/**
 * Step 2: Create Invoice/Payment Link
 */
async function createPaymentLink(
  idToken: string,
  taskId: string,
  amount: number,
  clientName: string,
  clientPhone: string,
  callBackUrl: string,
  cancelUrl: string
): Promise<{ url: string; transactionNo: string }> {
  
  const invoiceBody = {
    amount: amount,
    clientName: clientName,
    clientMobile: clientPhone,
    orderNumber: `Task-${taskId}`,
    callBackUrl: callBackUrl,
    cancelUrl: cancelUrl,
    products: [
      {
        title: 'Task Payment',
        price: amount,
        qty: 1,
      },
    ],
  }

  const response = await fetch(PAYLINK_INVOICE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(invoiceBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Paylink invoice error:', errorText)
    throw new Error('Failed to create payment link')
  }

  const data: PaylinkInvoiceResponse = await response.json()

  // Paylink returns the URL and transaction number in different formats
  const paymentUrl = data.url || data.gatewayOrderRequest?.url
  const transactionNo = data.transactionNo || data.gatewayOrderRequest?.transactionNo

  if (!paymentUrl || !transactionNo) {
    console.error('Invalid Paylink response:', data)
    throw new Error('Invalid response from Paylink')
  }

  return {
    url: paymentUrl,
    transactionNo: transactionNo,
  }
}

serve(async (req) => {
  // Handle CORS preflight
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

  // Only allow POST requests
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Check authentication
    const user = await getCurrentUser(req)
    if (!user) {
      return createErrorResponse('Not authenticated', 401)
    }

    // Parse request body
    const body: PaymentRequest = await req.json()
    const { taskId, amount, clientPhone, clientName, callBackUrl, cancelUrl } = body

    // Validate required fields
    if (!taskId) {
      return createErrorResponse('taskId is required', 400)
    }

    if (!amount || amount <= 0) {
      return createErrorResponse('Valid amount is required', 400)
    }

    if (!clientPhone) {
      return createErrorResponse('clientPhone is required', 400)
    }

    // Get Supabase client to verify task exists
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify task exists
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, budget, client_id')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return createErrorResponse('Task not found', 404)
    }

    // Get base URL for callbacks (use provided URLs or fallback)
    const baseUrl = Deno.env.get('APP_BASE_URL') || 'http://localhost:3000'
    const successUrl = callBackUrl || `${baseUrl}/payment/success`
    const failedUrl = cancelUrl || `${baseUrl}/payment/failed`

    // Use provided client name or fetch from user
    const customerName = clientName || user.name || 'Customer'

    // Step 1: Authenticate with Paylink
    console.log('Authenticating with Paylink...')
    const idToken = await authenticatePaylink()

    // Step 2: Create payment link
    console.log('Creating payment link...')
    const paymentResult = await createPaymentLink(
      idToken,
      taskId,
      amount,
      customerName,
      clientPhone,
      successUrl,
      failedUrl
    )

    // Optionally store payment record in database
    const { error: paymentRecordError } = await supabase
      .from('payments')
      .insert({
        task_id: taskId,
        user_id: user.id,
        amount: amount,
        transaction_no: paymentResult.transactionNo,
        payment_url: paymentResult.url,
        status: 'pending',
        provider: 'paylink',
      })
      .select()
      .single()

    // Log error but don't fail if payments table doesn't exist
    if (paymentRecordError) {
      console.warn('Could not save payment record:', paymentRecordError.message)
    }

    // Return success response
    return createResponse({
      success: true,
      url: paymentResult.url,
      transactionNo: paymentResult.transactionNo,
    })

  } catch (error) {
    console.error('Payment link creation error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create payment link',
      500
    )
  }
})
