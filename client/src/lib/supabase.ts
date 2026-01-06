import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tywwcinmoncjkitzqfaa.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_abSbDhFuX3gx-SNlM3RUnA_68duuFjN';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/lib/supabase.ts:5',message:'Supabase client init',data:{hasEnvUrl:!!import.meta.env.VITE_SUPABASE_URL,hasEnvKey:!!import.meta.env.VITE_SUPABASE_ANON_KEY,url:SUPABASE_URL.substring(0,30)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

