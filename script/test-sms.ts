/**
 * Test script for Authentica SMS service
 * Run with: npx tsx script/test-sms.ts
 */

import 'dotenv/config';
import { sendOtpSms, formatPhoneNumber, isValidSaudiPhone } from '../server/sms';

async function testSms() {
  console.log('🧪 Testing Authentica SMS Service\n');
  
  // Check API key
  const apiKey = process.env.AUTHENTICA_API_KEY;
  if (!apiKey) {
    console.error('❌ AUTHENTICA_API_KEY is not set in .env file');
    console.log('\n📝 To fix:');
    console.log('1. Sign up at https://authentica.sa');
    console.log('2. Get your API key from dashboard');
    console.log('3. Add AUTHENTICA_API_KEY=your_key to .env file\n');
    process.exit(1);
  }
  
  console.log('✅ AUTHENTICA_API_KEY is configured');
  console.log(`   Key preview: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);
  
  // Test phone number formatting
  const testPhones = ['0501234567', '501234567', '966501234567', '+966501234567'];
  console.log('📱 Testing phone number formatting:');
  testPhones.forEach(phone => {
    const formatted = formatPhoneNumber(phone);
    const isValid = isValidSaudiPhone(phone);
    console.log(`   ${phone.padEnd(15)} → ${formatted.padEnd(15)} (valid: ${isValid ? '✅' : '❌'})`);
  });
  console.log();
  
  // Test SMS sending (use a test phone number)
  const testPhone = process.argv[2] || '0501234567';
  const testCode = '123456';
  
  if (!isValidSaudiPhone(testPhone)) {
    console.error(`❌ Invalid phone number: ${testPhone}`);
    console.log('   Please provide a valid Saudi phone number (e.g., 0501234567)');
    process.exit(1);
  }
  
  console.log(`📤 Sending test OTP to: ${testPhone}`);
  console.log(`   Code: ${testCode}\n`);
  
  try {
    const result = await sendOtpSms(testPhone, testCode, 'login');
    
    if (result.success) {
      console.log('✅ SMS sent successfully!');
      console.log(`   Message ID: ${result.messageId || 'N/A'}`);
      console.log('\n💡 Check your phone for the SMS message.');
    } else {
      console.error('❌ Failed to send SMS');
      console.error(`   Error: ${result.error}`);
      console.log('\n🔍 Troubleshooting:');
      console.log('1. Check your API key is correct');
      console.log('2. Verify your Authentica account is active');
      console.log('3. Check Authentica dashboard for account status');
      console.log('4. Review server logs for detailed error messages');
    }
  } catch (error: any) {
    console.error('❌ Exception occurred:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

testSms().catch(console.error);













