import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  // 304 Not Modified is a valid caching response and shouldn't be treated as an error
  if (!res.ok && res.status !== 304) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        signal,
        // Add cache headers for browser caching
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      // If 304 Not Modified status is returned:
      // The most reliable solution is to make a new request ignoring cache
      // This ensures we always get data even in production environments
      if (res.status === 304) {
        console.log('304 Not Modified received, fetching fresh data for:', queryKey[0]);
        
        // Make a new request with cache-busting query parameter
        const cacheBustUrl = new URL(queryKey[0] as string, window.location.origin);
        cacheBustUrl.searchParams.append('_cb', Date.now().toString());
        
        const freshRes = await fetch(cacheBustUrl.toString(), {
          credentials: "include",
          signal,
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });
        
        if (!freshRes.ok) {
          const text = (await freshRes.text()) || freshRes.statusText;
          throw new Error(`${freshRes.status}: ${text}`);
        }
        
        return await freshRes.json();
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // If the error is an AbortError, rethrow it (this is for canceled requests)
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      
      console.error('Error fetching data:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
