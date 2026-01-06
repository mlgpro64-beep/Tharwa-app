import 'dotenv/config';
import { db } from '../server/db';
import { users, notifications } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function approveTasker(emailOrUsername?: string) {
  try {
    let user;
    
    if (emailOrUsername) {
      // Try to find user by email or username
      const allUsers = await db.select().from(users);
      user = allUsers.find(u => 
        u.email === emailOrUsername || 
        u.username === emailOrUsername ||
        u.id === emailOrUsername
      );
      
      if (!user) {
        console.error('❌ User not found with:', emailOrUsername);
        console.log('\n📋 Available users:');
        allUsers.forEach(u => {
          console.log(`  - ${u.name} (${u.email}) - ID: ${u.id} - Status: ${u.verificationStatus || 'N/A'}`);
        });
        process.exit(1);
      }
    } else {
      // Get all pending taskers
      const pendingTaskers = await db.select().from(users).where(
        eq(users.verificationStatus, 'pending')
      );
      
      if (pendingTaskers.length === 0) {
        console.log('✅ No pending taskers found!');
        process.exit(0);
      }
      
      if (pendingTaskers.length === 1) {
        user = pendingTaskers[0];
        console.log(`📝 Found 1 pending tasker: ${user.name} (${user.email})`);
      } else {
        console.log(`\n📋 Found ${pendingTaskers.length} pending taskers:`);
        pendingTaskers.forEach((u, index) => {
          console.log(`  ${index + 1}. ${u.name} (${u.email}) - ID: ${u.id}`);
        });
        console.log('\n❌ Please specify which user to approve:');
        console.log('   npm run approve-tasker -- <email|username|id>');
        process.exit(1);
      }
    }
    
    if (!user.taskerType) {
      console.error('❌ This user is not a tasker!');
      process.exit(1);
    }
    
    if (user.verificationStatus === 'approved') {
      console.log('✅ User is already approved!');
      process.exit(0);
    }
    
    // Update user status
    const [updated] = await db.update(users)
      .set({ verificationStatus: 'approved' })
      .where(eq(users.id, user.id))
      .returning();
    
    // Create notification
    await db.insert(notifications).values({
      userId: user.id,
      type: 'system',
      title: 'تم اعتماد حسابك',
      message: user.taskerType === 'specialized'
        ? 'تهانينا! تم التحقق من شهادتك واعتماد حسابك كمنفذ متخصص'
        : 'تهانينا! تم اعتماد حسابك كمنفذ عام',
      icon: 'badge-check',
      color: 'success',
      actionUrl: '/profile',
    });
    
    console.log('\n✅ Tasker approved successfully!');
    console.log(`   Name: ${updated.name}`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Tasker Type: ${updated.taskerType}`);
    console.log(`   Status: ${updated.verificationStatus}`);
    console.log(`   Role: ${updated.role}`);
    console.log('\n📬 Notification sent to user');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error approving tasker:', error.message);
    process.exit(1);
  }
}

const emailOrUsername = process.argv[2];
approveTasker(emailOrUsername);













