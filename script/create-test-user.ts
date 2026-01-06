import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../server/db';
import { users } from '../shared/schema';

async function createTestUser() {
  try {
    const testPassword = 'test123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      phone: '0501234567',
      role: 'client' as const,
    };
    
    const [user] = await db.insert(users).values(testUser).returning();
    
    console.log('✅ Test user created successfully!');
    console.log('Username: testuser');
    console.log('Password: test123');
    console.log('Email: test@example.com');
    console.log('User ID:', user.id);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  }
}

createTestUser();
