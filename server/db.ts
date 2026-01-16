import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  console.error('Please set DATABASE_URL in your .env file or environment variables.');
  console.error('Get it from: https://tywwcinmoncjkitzqfaa.supabase.co → Settings → Database');
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Parse connection string and add SSL if needed
const isSupabase = process.env.DATABASE_URL?.includes('supabase');

// Remove sslmode from connection string - we'll handle SSL in config
let connectionString = process.env.DATABASE_URL || '';
if (isSupabase) {
  // Remove any existing sslmode parameter
  connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '');
}

const connectionConfig: any = {
  connectionString,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
};

// Add SSL config for Supabase (disable certificate verification for self-signed certs)
if (isSupabase) {
  // For Supabase, we need to disable certificate verification
  // because they use self-signed certificates in some cases
  connectionConfig.ssl = {
    rejectUnauthorized: false
  };
}

export const pool = new Pool(connectionConfig);

// Test connection on startup
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err.message);
});

// Test connection
pool.query('SELECT NOW()').then((result) => {
  console.log('✅ Database connection successful');
}).catch((err) => {
  console.error('❌ Database connection failed:', err.message);
  console.error('Full error:', err);
});
export const db = drizzle(pool, { schema });
