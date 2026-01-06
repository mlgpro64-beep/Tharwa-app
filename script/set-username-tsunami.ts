/**
 * Script to set username "tsunami" for a specific user
 * Usage: npx tsx script/set-username-tsunami.ts <userId or email>
 */

import 'dotenv/config';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq, or } from 'drizzle-orm';

async function setUsernameTsunami(identifier: string) {
  try {
    // Try to find user by ID or email
    const userResults = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.id, identifier),
          eq(users.email, identifier)
        )
      )
      .limit(1);
    
    const user = userResults[0];
    
    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }
    
    // Check if username "tsunami" is already taken by another user
    const existingUserResults = await db
      .select()
      .from(users)
      .where(eq(users.username, 'tsunami'))
      .limit(1);
    
    const existingUser = existingUserResults[0];
    if (existingUser && existingUser.id !== user.id) {
      console.error(`❌ Username "tsunami" is already taken by user: ${existingUser.id} (${existingUser.email})`);
      process.exit(1);
    }
    
    // Update username
    await db
      .update(users)
      .set({ username: 'tsunami' })
      .where(eq(users.id, user.id));
    
    console.log(`✅ Successfully set username "tsunami" for user:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Previous username: ${user.username}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const identifier = process.argv[2];
if (!identifier) {
  console.error('Usage: npx tsx script/set-username-tsunami.ts <userId or email>');
  process.exit(1);
}

setUsernameTsunami(identifier);













