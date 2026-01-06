/**
 * Script to create a user with phone number and get OTP code
 * Usage: npx tsx script/create-user-and-get-otp.ts <phone> [username] [name]
 * Example: npx tsx script/create-user-and-get-otp.ts 0512345678 testuser "Test User"
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

async function createUserAndGetOTP(phone: string, username?: string, name?: string) {
  try {
    // Validate phone format
    if (!/^05\d{8}$/.test(phone)) {
      console.error('❌ Invalid Saudi phone number format');
      console.error('   Phone should start with 05 and be 10 digits total');
      console.error('   Example: 0512345678');
      process.exit(1);
    }

    // Check if user already exists
    const existingUsers = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    
    if (existingUsers.length > 0) {
      console.log('✅ User already exists with this phone number');
      console.log(`   Username: ${existingUsers[0].username}`);
      console.log(`   Name: ${existingUsers[0].name}`);
    } else {
      // Create new user
      const defaultUsername = username || `user${phone.slice(-4)}`;
      const defaultName = name || `User ${phone}`;
      const defaultEmail = `${defaultUsername}@tharwa.local`;
      const defaultPassword = '123456'; // Simple password for testing
      
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      const newUser = {
        username: defaultUsername,
        email: defaultEmail,
        password: hashedPassword,
        name: defaultName,
        phone: phone,
        role: 'client' as const,
      };
      
      const [user] = await db.insert(users).values(newUser).returning();
      
      console.log('✅ User created successfully!');
      console.log(`   Username: ${user.username}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${defaultPassword}`);
    }

    // Now get OTP code
    console.log('\n📱 Requesting OTP code...\n');

    const response = await fetch(`${API_URL}/api/auth/send-phone-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        type: 'login',
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
    }

    return data.devCode || null;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('fetch')) {
      console.error('\n💡 Make sure the server is running on:', API_URL);
    }
    process.exit(1);
  }
}

// Main execution
const phone = process.argv[2];
const username = process.argv[3];
const name = process.argv[4];

if (!phone) {
  console.error('❌ Usage: npx tsx script/create-user-and-get-otp.ts <phone_number> [username] [name]');
  console.error('   Example: npx tsx script/create-user-and-get-otp.ts 0512345678');
  console.error('   Example: npx tsx script/create-user-and-get-otp.ts 0512345678 testuser "Test User"');
  process.exit(1);
}

createUserAndGetOTP(phone, username, name);













