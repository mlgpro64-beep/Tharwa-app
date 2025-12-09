// Authentica SMS Service for OTP verification (Saudi Arabia)
// API Documentation: https://authenticasa.docs.apiary.io

const AUTHENTICA_API_KEY = process.env.AUTHENTICA_API_KEY;

interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendOtpSms(phoneNumber: string, code: string, type: 'registration' | 'login' | 'password_reset'): Promise<SmsResponse> {
  if (!AUTHENTICA_API_KEY) {
    console.error('[SMS] Authentica API key not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  // Format phone number to international format (+966...)
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  try {
    // Use Authentica's send-otp endpoint
    // Template 1 is the default Arabic template
    const response = await fetch('https://api.authentica.sa/api/v2/send-otp', {
      method: 'POST',
      headers: {
        'X-Authorization': AUTHENTICA_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        method: 'sms',
        phone: formattedPhone,
        otp: code,
        template_id: 1 // Default Arabic template
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[SMS] Authentica error:', data);
      return { success: false, error: data.message || data.error || 'Failed to send SMS' };
    }

    // Check if OTP was sent successfully
    if (data.success || data.status === 'success' || response.status === 200) {
      console.log(`[SMS] OTP sent via Authentica to ${formattedPhone} for ${type}`);
      return { success: true, messageId: data.transaction_id || data.id };
    }

    console.error('[SMS] Unexpected Authentica response:', data);
    return { success: false, error: data.message || 'Unknown error' };
  } catch (error: any) {
    console.error('[SMS] Failed to send OTP via Authentica:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyOtpWithAuthentica(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }> {
  if (!AUTHENTICA_API_KEY) {
    return { success: false, error: 'SMS service not configured' };
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);

  try {
    const response = await fetch('https://api.authentica.sa/api/v2/verify-otp', {
      method: 'POST',
      headers: {
        'X-Authorization': AUTHENTICA_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        phone: formattedPhone,
        otp: code
      })
    });

    const data = await response.json();

    if (response.ok && (data.success || data.verified || data.status === 'success')) {
      return { success: true };
    }

    return { success: false, error: data.message || 'Invalid OTP' };
  } catch (error: any) {
    console.error('[SMS] Failed to verify OTP via Authentica:', error);
    return { success: false, error: error.message };
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or special characters
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // If it starts with 0, assume Saudi Arabia and replace with +966
  if (cleaned.startsWith('0')) {
    cleaned = '+966' + cleaned.substring(1);
  }
  
  // If it doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    // If it starts with 966, add +
    if (cleaned.startsWith('966')) {
      cleaned = '+' + cleaned;
    } else {
      // Assume Saudi Arabia
      cleaned = '+966' + cleaned;
    }
  }
  
  return cleaned;
}

export function isValidSaudiPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Saudi mobile numbers start with 05 or +9665
  // Valid formats: 05XXXXXXXX, 5XXXXXXXX, 9665XXXXXXXX, +9665XXXXXXXX
  const patterns = [
    /^05\d{8}$/,           // 05XXXXXXXX
    /^5\d{8}$/,            // 5XXXXXXXX
    /^9665\d{8}$/,         // 9665XXXXXXXX
    /^\+9665\d{8}$/        // +9665XXXXXXXX
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}
