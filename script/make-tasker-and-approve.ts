/**
 * Script to convert a user to tasker and approve them
 * Usage: npx tsx script/make-tasker-and-approve.ts <phone|email|username|id> [taskerType]
 * Example: npx tsx script/make-tasker-and-approve.ts 0512345678
 * Example: npx tsx script/make-tasker-and-approve.ts 0512345678 specialized
 */

import 'dotenv/config';
import { db } from '../server/db';
import { users, notifications } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function makeTaskerAndApprove(identifier: string, taskerType: 'general' | 'specialized' = 'general') {
  try {
    // Find user by phone, email, username, or id
    const allUsers = await db.select().from(users);
    const user = allUsers.find(u => 
      u.phone === identifier ||
      u.email === identifier || 
      u.username === identifier ||
      u.id === identifier
    );
    
    if (!user) {
      console.error('❌ User not found with:', identifier);
      console.log('\n📋 Available users:');
      allUsers.forEach(u => {
        console.log(`  - ${u.name} (${u.phone || 'no phone'}) - ${u.email} - @${u.username} - Role: ${u.role} - Status: ${u.verificationStatus || 'N/A'}`);
      });
      process.exit(1);
    }
    
    console.log(`\n👤 Found user: ${user.name}`);
    console.log(`   Phone: ${user.phone || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Current Tasker Type: ${user.taskerType || 'N/A'}`);
    console.log(`   Current Status: ${user.verificationStatus || 'N/A'}\n`);
    
    // Update user to be a tasker
    const updateData: any = {
      role: 'tasker',
      taskerType: taskerType,
      verificationStatus: 'approved', // Auto-approve
    };
    
    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();
    
    // Create notification
    await db.insert(notifications).values({
      userId: user.id,
      type: 'system',
      title: 'تم اعتماد حسابك كمنفذ',
      message: taskerType === 'specialized'
        ? 'تهانينا! تم اعتماد حسابك كمنفذ متخصص. يمكنك الآن البدء في قبول المهام.'
        : 'تهانينا! تم اعتماد حسابك كمنفذ عام. يمكنك الآن البدء في قبول المهام.',
      icon: 'badge-check',
      color: 'success',
      actionUrl: '/profile',
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ User converted to tasker and approved!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Name: ${updated.name}`);
    console.log(`   Phone: ${updated.phone || 'N/A'}`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Username: ${updated.username}`);
    console.log(`   Role: ${updated.role}`);
    console.log(`   Tasker Type: ${updated.taskerType}`);
    console.log(`   Verification Status: ${updated.verificationStatus}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📬 Notification sent to user');
    console.log('🎉 User can now switch to tasker role and accept tasks!\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const identifier = process.argv[2];
const taskerType = (process.argv[3] as 'general' | 'specialized') || 'general';

if (!identifier) {
  console.error('❌ Usage: npx tsx script/make-tasker-and-approve.ts <phone|email|username|id> [taskerType]');
  console.error('   Example: npx tsx script/make-tasker-and-approve.ts 0512345678');
  console.error('   Example: npx tsx script/make-tasker-and-approve.ts 0512345678 specialized');
  process.exit(1);
}

if (taskerType !== 'general' && taskerType !== 'specialized') {
  console.error('❌ Invalid tasker type. Must be "general" or "specialized"');
  process.exit(1);
}

makeTaskerAndApprove(identifier, taskerType);













