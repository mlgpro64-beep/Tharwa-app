import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  // Try environment variables first (for Cursor/local development)
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL,
    };
  }

  // Fallback to Replit connectors (for Replit deployment)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Resend credentials not found. Set RESEND_API_KEY and RESEND_FROM_EMAIL in .env file, or use Replit connectors.');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendOtpEmail(to: string, code: string, type: 'registration' | 'login' | 'password_reset' | 'email_verification') {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const subjects = {
      registration: 'THARWA - رمز التحقق للتسجيل | Verification Code',
      login: 'THARWA - رمز الدخول | Login Code',
      password_reset: 'THARWA - إعادة تعيين كلمة المرور | Password Reset',
      email_verification: 'THARWA - تأكيد البريد الإلكتروني | Email Verification'
    };

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); margin: 0; padding: 40px 20px; }
    .container { max-width: 480px; margin: 0 auto; background: rgba(255,255,255,0.95); border-radius: 24px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo h1 { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0; }
    .code-box { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); border-radius: 16px; padding: 24px; text-align: center; margin: 30px 0; }
    .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: white; margin: 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.6; text-align: center; }
    .message-ar { font-size: 18px; margin-bottom: 20px; }
    .message-en { font-size: 14px; color: #718096; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 12px; }
    .warning { background: #fff5f5; border-radius: 12px; padding: 16px; margin-top: 20px; color: #c53030; font-size: 13px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1>ذروة THARWA</h1>
    </div>
    
    <div class="message message-ar">
      ${type === 'registration' ? 'مرحباً بك في ذروة! استخدم هذا الرمز لإكمال تسجيلك:' :
        type === 'login' ? 'استخدم هذا الرمز لتسجيل الدخول إلى حسابك:' :
        type === 'password_reset' ? 'استخدم هذا الرمز لإعادة تعيين كلمة المرور:' :
        'استخدم هذا الرمز لتأكيد بريدك الإلكتروني:'}
    </div>
    
    <div class="code-box">
      <p class="code">${code}</p>
    </div>
    
    <div class="message message-en">
      ${type === 'registration' ? 'Welcome to THARWA! Use this code to complete your registration.' :
        type === 'login' ? 'Use this code to sign in to your account.' :
        type === 'password_reset' ? 'Use this code to reset your password.' :
        'Use this code to verify your email address.'}
    </div>
    
    <div class="warning">
      ⚠️ هذا الرمز صالح لمدة 10 دقائق فقط. لا تشاركه مع أحد.<br/>
      This code expires in 10 minutes. Never share it with anyone.
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} THARWA - ذروة</p>
      <p>Riyadh, Saudi Arabia</p>
    </div>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'THARWA <noreply@resend.dev>',
      to: [to],
      subject: subjects[type],
      html: htmlContent,
    });

    console.log(`[Email] OTP sent to ${to} for ${type}:`, result);
    return { success: true, id: result.data?.id };
  } catch (error: any) {
    console.error('[Email] Failed to send OTP:', error);
    return { success: false, error: error.message };
  }
}
