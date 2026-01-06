import 'dotenv/config';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await db.select().from(users).where(eq(users.username, 'testuser')).limit(1);
    console.log('✅ Connection successful!');
    console.log('User found:', result[0] ? result[0].username : 'Not found');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Connection error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
