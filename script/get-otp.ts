/**
 * Script to get OTP code for a phone number
 * Usage: npx tsx script/get-otp.ts <phone_number> [type]
 * Example: npx tsx script/get-otp.ts 0512345678 login
 */

import 'dotenv/config';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

async function getOTP(phone: string, type: 'login' | 'registration' = 'login') {
  try {
    console.log(`\n📱 Requesting OTP for phone: ${phone}`);
    console.log(`📋 Type: ${type}`);
    console.log(`🌐 API URL: ${API_URL}\n`);

    const response = await fetch(`${API_URL}/api/auth/send-phone-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        type,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', data.error || data.errorEn || 'Unknown error');
      if (data.errorEn && data.errorEn !== data.error) {
        console.error('   (EN):', data.errorEn);
      }
      process.exit(1);
    }

    if (data.devCode) {
      console.log('✅ OTP Code Generated Successfully!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   📱 Phone: ${phone}`);
      console.log(`   🔐 OTP Code: ${data.devCode}`);
      console.log(`   ⏰ Valid for: 10 minutes`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      if (data.warning) {
        console.log('⚠️  Warning:', data.warning);
      }
      
      if (data.note) {
        console.log('ℹ️  Note:', data.note);
      }
    } else {
      console.log('✅ OTP sent successfully via SMS');
      console.log('📨 Check your SMS messages for the code');
      
      if (data.message) {
        console.log('   Message:', data.message);
      }
    }

    return data.devCode || null;
  } catch (error: any) {
    console.error('❌ Failed to get OTP:', error.message);
    if (error.message.includes('fetch')) {
      console.error('\n💡 Make sure the server is running on:', API_URL);
    }
    process.exit(1);
  }
}

// Main execution
const phone = process.argv[2];
const type = (process.argv[3] as 'login' | 'registration') || 'login';

if (!phone) {
  console.error('❌ Usage: npx tsx script/get-otp.ts <phone_number> [type]');
  console.error('   Example: npx tsx script/get-otp.ts 0512345678 login');
  console.error('   Example: npx tsx script/get-otp.ts 0512345678 registration');
  process.exit(1);
}

// Validate phone format
if (!/^05\d{8}$/.test(phone)) {
  console.error('❌ Invalid Saudi phone number format');
  console.error('   Phone should start with 05 and be 10 digits total');
  console.error('   Example: 0512345678');
  process.exit(1);
}

getOTP(phone, type);













