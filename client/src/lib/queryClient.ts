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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:90',message:'Trying Supabase fallback',data:{url,path,tableName:path.split('/')[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      try {
        const tableName = path.split('/')[0];
        const { data: supabaseData, error } = await supabase
          .from(tableName)
          .select('*');
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:96',message:'Supabase query result',data:{url,hasError:!!error,hasData:!!supabaseData,dataLength:supabaseData?.length,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        if (!error && supabaseData) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:102',message:'Returning Supabase data',data:{url,dataLength:supabaseData.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          return new Response(JSON.stringify(supabaseData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:110',message:'Supabase error, falling through',data:{url,error:(e as Error)?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
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
  fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:apiRequest',message:'API request initiated',data:{method,url,fullUrl,hasAuth:!!headers.Authorization,hasData:!!data,windowLocation:typeof window!=='undefined'?window.location.href:''},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // #region agent log
  if (url.includes('payments')) {
    const resClone = res.clone();
    const resText = await resClone.text();
    fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:apiRequest:response',message:'Payment API response',data:{status:res.status,ok:res.ok,contentType:res.headers.get('content-type'),bodyPreview:resText.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  }
  // #endregion

  // #region agent log
  try {
    const responseText = await res.clone().text();
    let responseData: any = {};
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {}
    fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:131',message:'API response received',data:{status:res.status,ok:res.ok,url,hasData:!!responseData,responseKeys:responseData?Object.keys(responseData):[],responseTitle:responseData?.title,responseDescription:responseData?.description?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  } catch {}
  // #endregion

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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:163',message:'getQueryFn called',data:{url,queryKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:211',message:'Trying Supabase in getQueryFn',data:{url,tableName:url.split('/')[2]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        try {
          const tableName = url.split('/')[2]; // Extract table name from /api/tasks, etc.
          const { data, error } = await supabase
            .from(tableName)
            .select('*');
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:217',message:'Supabase query result in getQueryFn',data:{url,hasError:!!error,hasData:!!data,dataLength:data?.length,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          
          if (!error && data) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:221',message:'Returning Supabase data from getQueryFn',data:{url,dataLength:data.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            return data as T;
          }
        } catch (e) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:226',message:'Supabase error in getQueryFn, falling through',data:{url,error:(e as Error)?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          // Fall through to Express API
          console.warn(`[Query] Supabase query failed for ${url}, trying Express API`);
        }
      }
      
      // #region agent log
      if (!isSimpleListEndpoint) {
        fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:232',message:'Using Express API for non-simple endpoint',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      }
      // #endregion
      
      // Fallback to Express API
      const fullUrl = buildApiUrl(url);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:232',message:'Fetching from Express API in getQueryFn',data:{url,fullUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:260',message:'Express API response in getQueryFn',data:{url,status:res.status,hasData:!!jsonData,dataKeys:jsonData?Object.keys(jsonData):[],dataTitle:jsonData?.title,dataDescription:jsonData?.description?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return jsonData;
      }
      
      return null;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1cd6507-d4e0-471c-acc6-10053f70247e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryClient.ts:268',message:'Error in getQueryFn',data:{url,error:(error as Error)?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
