import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
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
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
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
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
    mutations: {
      retry: false,
    },
  },
});

// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Create a simple localStorage persister
const createLocalStoragePersister = (storage: Storage, key: string) => ({
  persistClient: async (client: any) => {
    try {
      storage.setItem(key, JSON.stringify(client));
    } catch (error) {
      console.warn('Failed to persist client to localStorage:', error);
    }
  },
  restoreClient: async (): Promise<any> => {
    try {
      const storedClient = storage.getItem(key);
      return storedClient ? JSON.parse(storedClient) : undefined;
    } catch (error) {
      console.warn('Failed to restore client from localStorage:', error);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      storage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove client from localStorage:', error);
    }
  },
});

// Initialize persistence only if localStorage is available
if (isLocalStorageAvailable()) {
  try {
    const localStoragePersister = createLocalStoragePersister(
      window.localStorage,
      "PINKY_TOE_CACHE"
    );

    // Persist the query client
    persistQueryClient({
      queryClient,
      persister: localStoragePersister,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      hydrateOptions: {},
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // Only persist successful queries that have data
          return query.state.status === 'success' && query.state.data !== undefined;
        },
      },
    });
    
    console.log('React Query persistence initialized with localStorage');
  } catch (error) {
    console.warn('Failed to initialize React Query persistence:', error);
  }
} else {
  console.warn('localStorage not available, React Query persistence disabled');
}
