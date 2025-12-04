// Infobip SMS Service for OTP verification

const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY;
const INFOBIP_BASE_URL = process.env.INFOBIP_BASE_URL;

interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendOtpSms(phoneNumber: string, code: string, type: 'registration' | 'login' | 'password_reset'): Promise<SmsResponse> {
  if (!INFOBIP_API_KEY || !INFOBIP_BASE_URL) {
    console.error('[SMS] Infobip credentials not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  // Format phone number - ensure it starts with country code
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  // Create bilingual message
  const messages = {
    registration: {
      ar: `مرحباً بك في ذروة! رمز التحقق الخاص بك هو: ${code}. صالح لمدة 10 دقائق.`,
      en: `Welcome to THARWA! Your verification code is: ${code}. Valid for 10 minutes.`
    },
    login: {
      ar: `رمز الدخول إلى ذروة: ${code}. صالح لمدة 10 دقائق.`,
      en: `THARWA login code: ${code}. Valid for 10 minutes.`
    },
    password_reset: {
      ar: `رمز إعادة تعيين كلمة المرور لذروة: ${code}. صالح لمدة 10 دقائق.`,
      en: `THARWA password reset code: ${code}. Valid for 10 minutes.`
    }
  };

  const message = `${messages[type].ar}\n\n${messages[type].en}`;

  try {
    const response = await fetch(`https://${INFOBIP_BASE_URL}/sms/2/text/advanced`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            destinations: [{ to: formattedPhone }],
            from: 'THARWA',
            text: message
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[SMS] Infobip error:', data);
      return { success: false, error: data.requestError?.serviceException?.text || 'Failed to send SMS' };
    }

    const messageInfo = data.messages?.[0];
    if (messageInfo?.status?.groupName === 'PENDING' || messageInfo?.status?.groupName === 'DELIVERED') {
      console.log(`[SMS] OTP sent to ${formattedPhone} for ${type}:`, messageInfo.messageId);
      return { success: true, messageId: messageInfo.messageId };
    }

    console.error('[SMS] Unexpected response:', data);
    return { success: false, error: messageInfo?.status?.description || 'Unknown error' };
  } catch (error: any) {
    console.error('[SMS] Failed to send OTP:', error);
    return { success: false, error: error.message };
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or special characters
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // If it starts with 0, assume Saudi Arabia and replace with +966
  if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
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
