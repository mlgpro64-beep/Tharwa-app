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
  // Skip nested endpoints like /api/tasks/:id/messages, /api/tasks/:id/bids - these need Express API
  const isNestedApiEndpoint = /\/api\/tasks\/[^/]+\/(messages|bids)/.test(url);
  const isSimpleListEndpoint = url === '/api/tasks' || url === '/api/users' || url === '/api/messages';
  if (url.startsWith('/api/') && method === 'GET' && !isNestedApiEndpoint && isSimpleListEndpoint) {
    const path = url.replace('/api/', '');
    // Try Supabase table query only for simple list endpoints
    if (path === 'tasks' || path === 'users' || path === 'messages') {
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
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  const { on401: unauthorizedBehavior } = options;
  return async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    
    try {
      // Never use Supabase for auth endpoints
      if (url.startsWith('/api/auth/')) {
        const fullUrl = buildApiUrl(url);
        const res = await fetch(fullUrl, {
          credentials: "include",
          headers: await getAuthHeaders(),
          signal: AbortSignal.timeout(10000), // 10 second timeout
      }).catch((error: unknown) => {
        // Network error - return null instead of throwing
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
        throw new Error(`Network error: ${errorMessage}`);
      });

        // Handle fetch errors (like timeout)
        if (!res) {
          if (unauthorizedBehavior === "returnNull") {
            return null;
          }
          throw new Error('Failed to fetch: network error');
        }

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        if (!res.ok && res.status !== 401) {
          await throwIfResNotOk(res);
        }
        
        if (res.ok) {
          return await res.json();
        }
        
        return null;
      }
      
      // Try Supabase first for database queries (non-auth endpoints only)
      // ONLY use Supabase for simple list endpoints (/api/tasks, /api/users, /api/messages)
      // Everything else goes to Express API (specific resources, nested endpoints, etc.)
      const isSimpleListEndpoint = url === '/api/tasks' || url === '/api/users' || url === '/api/messages';
      if (isSimpleListEndpoint) {
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
          console.warn(`[Query] Supabase query failed for ${url}, trying Express API`);
        }
      }
      
      // Fallback to Express API
      const fullUrl = buildApiUrl(url);
      const res = await fetch(fullUrl, {
        credentials: "include",
        headers: await getAuthHeaders(),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }).catch((error: unknown) => {
        // Network error - return null instead of throwing
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
        throw new Error(`Network error: ${errorMessage}`);
      });

      // Handle fetch errors (like timeout)
      if (!res) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error('Failed to fetch: network error');
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      if (!res.ok && res.status !== 401) {
        await throwIfResNotOk(res);
      }
      
      if (res.ok) {
        const jsonData = await res.json();
        return jsonData;
      }
      
      return null;
    } catch (error) {
      // If it's a 401 and we're allowed to return null, do so
      if (unauthorizedBehavior === "returnNull" && error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message);
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          return null;
        }
      }
      
      // For other errors, still throw but with better message
      throw error;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      retryOnMount: false,
      // Better error handling - don't throw on network errors, just return null
      throwOnError: false,
    },
    mutations: {
      retry: false,
      // Don't throw on mutation errors, let components handle them
      throwOnError: false,
    },
  },
});
