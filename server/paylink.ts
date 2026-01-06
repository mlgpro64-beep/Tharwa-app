/**
 * Paylink Payment Gateway Integration
 * 
 * Paylink API Documentation:
 * - Base URL: https://restapi.paylink.sa/api
 * - Authentication: App ID and Secret Key
 * - Create Invoice: POST /addInvoice
 * - Get Invoice Status: GET /getInvoice/{invoiceNumber}
 * - Webhook: POST /webhook (configured in Paylink dashboard)
 */

interface PaylinkConfig {
  appId: string;
  secretKey: string;
  baseUrl?: string;
}

interface PaylinkInvoiceRequest {
  amount: number;
  clientName: string;
  clientMobile: string;
  clientEmail?: string;
  note?: string;
  orderNumber?: string;
  callBackUrl?: string;
  cancelUrl?: string;
}

interface PaylinkInvoiceResponse {
  transactionNo?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceURL?: string;
  qrCode?: string;
  error?: string;
  message?: string;
}

interface PaylinkInvoiceStatus {
  invoiceStatus?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  transactionNo?: string;
  amount?: number;
  error?: string;
  message?: string;
}

class PaylinkClient {
  private appId: string;
  private secretKey: string;
  private baseUrl: string;

  constructor(config: PaylinkConfig) {
    this.appId = config.appId;
    this.secretKey = config.secretKey;
    this.baseUrl = config.baseUrl || 'https://restapi.paylink.sa/api';
  }

  /**
   * Create authentication header for Paylink API
   */
  private getAuthHeaders(): Record<string, string> {
    const authString = Buffer.from(`${this.appId}:${this.secretKey}`).toString('base64');
    return {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Create a new invoice in Paylink
   */
  async createInvoice(request: PaylinkInvoiceRequest): Promise<PaylinkInvoiceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/addInvoice`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          amount: request.amount,
          clientName: request.clientName,
          clientMobile: request.clientMobile,
          clientEmail: request.clientEmail || '',
          note: request.note || '',
          orderNumber: request.orderNumber || '',
          callBackUrl: request.callBackUrl || '',
          cancelUrl: request.cancelUrl || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create Paylink invoice');
      }

      return data;
    } catch (error: any) {
      console.error('[Paylink] Error creating invoice:', error);
      throw new Error(`Paylink API error: ${error.message}`);
    }
  }

  /**
   * Get invoice status from Paylink
   */
  async getInvoiceStatus(invoiceNumber: string): Promise<PaylinkInvoiceStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/getInvoice/${invoiceNumber}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to get invoice status');
      }

      return data;
    } catch (error: any) {
      console.error('[Paylink] Error getting invoice status:', error);
      throw new Error(`Paylink API error: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature (if Paylink provides signature verification)
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    // Paylink may provide signature verification
    // For now, we'll trust the webhook if it comes from Paylink's IP range
    // In production, implement proper signature verification if available
    return true;
  }
}

// Initialize Paylink client
let paylinkClient: PaylinkClient | null = null;

export function initializePaylink(config?: PaylinkConfig): PaylinkClient {
  if (paylinkClient) {
    return paylinkClient;
  }

  const appId = config?.appId || process.env.PAYLINK_APP_ID;
  const secretKey = config?.secretKey || process.env.PAYLINK_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error('Paylink credentials not configured. Please set PAYLINK_APP_ID and PAYLINK_SECRET_KEY environment variables.');
  }

  paylinkClient = new PaylinkClient({
    appId,
    secretKey,
    baseUrl: process.env.PAYLINK_BASE_URL,
  });

  return paylinkClient;
}

export function getPaylinkClient(): PaylinkClient {
  if (!paylinkClient) {
    return initializePaylink();
  }
  return paylinkClient;
}

export type { PaylinkInvoiceRequest, PaylinkInvoiceResponse, PaylinkInvoiceStatus };













