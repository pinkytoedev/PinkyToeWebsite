/**
 * Console Commands
 * 
 * This module exposes admin functionality to be run from the browser's console.
 * Do not import these directly in your components - they are meant to be
 * attached to the window object and called from the console.
 */

/**
 * Refreshes all cached data by invalidating the cache and fetching fresh data from Airtable.
 * 
 * Usage in browser console: 
 * > refreshCachedData()
 * or to refresh a specific entity:
 * > refreshCachedData('articles')
 * 
 * @param entity Optional entity name to refresh specific data ('articles', 'team', 'quotes', etc.). If not provided, all data will be refreshed.
 * @returns Promise that resolves when the refresh is complete
 */
export async function refreshCachedData(entity?: string): Promise<void> {
  console.log('🔄 Refreshing cached data...');

  try {
    // Make a request to the server endpoint to refresh cache
    const endpoint = entity
      ? `/api/admin/refresh/${entity}`
      : '/api/admin/refresh';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
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
 * > apiRefresh()
 * or to refresh a specific entity:
 * > apiRefresh('articles')
 * 
 * @param entity Optional entity name to refresh specific data
 * @returns Promise that resolves when the refresh is complete
 */
export async function apiRefresh(entity?: string): Promise<void> {
  console.log('🔄 Triggering API cache refresh...');

  try {
    const response = await fetch('/api/cache/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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

  // Log available commands
  console.log(
    '%c🛠️ Admin Console Commands',
    'font-weight: bold; font-size: 14px; color: #0066cc;'
  );
  console.log(
    '%c- refreshCachedData(entity?): Refreshes cached data via admin endpoints',
    'color: #333; font-size: 12px;'
  );
  console.log(
    '%c- apiRefresh(entity?): Refreshes cached data via direct API endpoint',
    'color: #333; font-size: 12px;'
  );
  console.log(
    '%cExamples:',
    'font-weight: bold; color: #444; font-size: 12px;'
  );
  console.log(
    '%c  refreshCachedData()          // Refresh all data via admin API',
    'color: #666; font-family: monospace;'
  );
  console.log(
    '%c  refreshCachedData("articles") // Refresh only articles via admin API',
    'color: #666; font-family: monospace;'
  );
  console.log(
    '%c  apiRefresh()                 // Refresh all data via cache API',
    'color: #666; font-family: monospace;'
  );
  console.log(
    '%c  apiRefresh("team")            // Refresh only team via cache API',
    'color: #666; font-family: monospace;'
  );
}


