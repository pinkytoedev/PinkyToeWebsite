/**
 * Console Commands
 * 
 * This module exposes admin functionality to be run from the browser's console.
 * Do not import these directly in your components - they are meant to be
 * attached to the window object and called from the console.
 *
 * The refresh endpoints require ADMIN_TOKEN in production, so pass it as the
 * last argument; without it the server answers 401 Unauthorized.
 */

/** Headers for an admin request, with the bearer token when one is given. */
function adminHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Refreshes all cached data by invalidating the cache and fetching fresh data from Airtable.
 * 
 * Usage in browser console: 
 * > refreshCachedData(undefined, 'YOUR_ADMIN_TOKEN')
 * or to refresh a specific entity:
 * > refreshCachedData('articles', 'YOUR_ADMIN_TOKEN')
 * 
 * @param entity Optional entity name to refresh specific data ('articles', 'team', 'quotes', etc.). If not provided, all data will be refreshed.
 * @param token The website's ADMIN_TOKEN. Required in production.
 * @returns Promise that resolves when the refresh is complete
 */
export async function refreshCachedData(entity?: string, token?: string): Promise<void> {
  console.log('🔄 Refreshing cached data...');

  try {
    // Make a request to the server endpoint to refresh cache
    const endpoint = entity
      ? `/api/admin/refresh/${entity}`
      : '/api/admin/refresh';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: adminHeaders(token)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Unknown error occurred');
    }

    const result = await response.json();
    console.log('✅ Cache refresh completed:', result);
  } catch (error) {
    console.error('❌ Failed to refresh cache:', error);
    throw error;
  }
}

/**
 * Triggers a cache refresh via API endpoint (same as refreshCachedData but via direct API call)
 * 
 * Usage in browser console:
 * > apiRefresh(undefined, 'YOUR_ADMIN_TOKEN')
 * or to refresh a specific entity:
 * > apiRefresh('articles', 'YOUR_ADMIN_TOKEN')
 * 
 * @param entity Optional entity name to refresh specific data
 * @param token The website's ADMIN_TOKEN. Required in production.
 * @returns Promise that resolves when the refresh is complete
 */
export async function apiRefresh(entity?: string, token?: string): Promise<void> {
  console.log('🔄 Triggering API cache refresh...');

  try {
    const response = await fetch('/api/cache/refresh', {
      method: 'POST',
      headers: adminHeaders(token),
      body: entity ? JSON.stringify({ entity }) : undefined
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API refresh failed');
    }

    const result = await response.json();
    console.log('✅ API refresh completed:', result);
  } catch (error) {
    console.error('❌ API refresh failed:', error);
    throw error;
  }
}

/**
 * Initialize console commands by attaching them to the window object
 */
export function initConsoleCommands(): void {
  // Attach to window object for console usage
  // TypeScript needs a type declaration for the window object extension
  (window as any).refreshCachedData = refreshCachedData;
  (window as any).apiRefresh = apiRefresh;
}



