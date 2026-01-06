import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { buildApiUrl } from "./config";
import { supabase } from "./supabase";

// Auth token storage for Capacitor iOS
const AUTH_TOKEN_KEY = 'tharwa_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  // Use Express token only (Supabase Auth disabled)
  const token = getAuthToken();
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

// Custom error class for rate limiting
export class RateLimitError extends Error {
  retryAfter: number;
  
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Handle rate limiting specifically
    if (res.status === 429) {
      try {
        const json = JSON.parse(text);
        throw new RateLimitError(json.error || 'تم تجاوز الحد الأقصى للطلبات', json.retryAfter || 60);
      } catch (e) {
        if (e instanceof RateLimitError) throw e;
        throw new RateLimitError('تم تجاوز الحد الأقصى للطلبات. حاول مرة أخرى لاحقاً', 60);
      }
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Always use Express API for auth endpoints and POST/PUT/DELETE requests
  // Only try Supabase for GET requests to specific endpoints
  if (url.startsWith('/api/auth/')) {
    // Always use Express API for auth endpoints
    const fullUrl = buildApiUrl(url);
    const headers: Record<string, string> = {};
    
    if (data) {
      headers['Content-Type'] = 'application/json';
    }
    
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  }
  
  // Try Supabase RPC first for certain GET endpoints only
  if (url.startsWith('/api/') && method === 'GET') {
    const path = url.replace('/api/', '');
    // Try Supabase table query only for non-auth endpoints
    if (path.includes('/tasks') || path.includes('/users') || path.includes('/messages')) {
      try {
        const tableName = path.split('/')[0];
        const { data: supabaseData, error } = await supabase
          .from(tableName)
          .select('*');
        
        if (!error && supabaseData) {
          return new Response(JSON.stringify(supabaseData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        // Fall through to Express API
      }
    }
  }
  
  // Fallback to Express API
  const fullUrl = buildApiUrl(url);
  const headers: Record<string, string> = {
    ...(await getAuthHeaders()),
  };
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/lib/queryClient.ts:110',message:'API request',data:{method,url,fullUrl,hasAuth:!!headers.Authorization},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/lib/queryClient.ts:125',message:'API response',data:{status:res.status,ok:res.ok,url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    
    // Never use Supabase for auth endpoints
    if (url.startsWith('/api/auth/')) {
      const fullUrl = buildApiUrl(url);
      const res = await fetch(fullUrl, {
        credentials: "include",
        headers: await getAuthHeaders(),
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    }
    
    // Try Supabase first for database queries (non-auth endpoints only)
    if (url.startsWith('/api/tasks') || url.startsWith('/api/users') || url.startsWith('/api/messages')) {
      try {
        const tableName = url.split('/')[2]; // Extract table name from /api/tasks, etc.
        const { data, error } = await supabase
          .from(tableName)
          .select('*');
        
        if (!error && data) {
          return data as T;
        }
      } catch (e) {
        // Fall through to Express API
      }
    }
    
    // Fallback to Express API
    const fullUrl = buildApiUrl(url);
    const res = await fetch(fullUrl, {
      credentials: "include",
      headers: await getAuthHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
