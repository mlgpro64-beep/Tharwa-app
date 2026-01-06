import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

// #region agent log
const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
try { 
  const logDir = path.dirname(logPath);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(logPath, JSON.stringify({location:'server/db.ts:11',message:'Checking DATABASE_URL',data:{hasDatabaseUrl:!!process.env.DATABASE_URL,nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n'); 
} catch {}
// #endregion

if (!process.env.DATABASE_URL) {
  // #region agent log
  try { fs.appendFileSync(logPath, JSON.stringify({location:'server/db.ts:15',message:'DATABASE_URL missing - ERROR',data:{error:'DATABASE_URL not set'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n'); } catch {}
  // #endregion
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
  // #region agent log
  try { fs.appendFileSync(logPath, JSON.stringify({location:'server/db.ts:60',message:'Database connection successful',data:{isSupabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n'); } catch {}
  // #endregion
  console.log('✅ Database connection successful');
}).catch((err) => {
  // #region agent log
  try { fs.appendFileSync(logPath, JSON.stringify({location:'server/db.ts:63',message:'Database connection failed',data:{error:err.message,isSupabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n'); } catch {}
  // #endregion
  console.error('❌ Database connection failed:', err.message);
  console.error('Full error:', err);
});
export const db = drizzle(pool, { schema });
