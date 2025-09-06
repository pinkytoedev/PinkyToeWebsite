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
 * Emergency refresh for critical content updates
 * Bypasses normal throttling and immediately refreshes critical content
 * 
 * Usage in browser console:
 * > emergencyRefresh()
 * 
 * @returns Promise that resolves when the emergency refresh is complete
 */
export async function emergencyRefresh(): Promise<void> {
  console.log('🚨 Triggering emergency refresh...');

  try {
    const response = await fetch('/api/cache/emergency-refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Emergency refresh failed');
    }

    const result = await response.json();
    console.log('🚨 Emergency refresh completed:', result);
  } catch (error) {
    console.error('🚨 Emergency refresh failed:', error);
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
  (window as any).emergencyRefresh = emergencyRefresh;

  // Log available commands
  console.log(
    '%c🛠️ Admin Console Commands',
    'font-weight: bold; font-size: 14px; color: #0066cc;'
  );
  console.log(
    '%c- refreshCachedData(entity?): Refreshes all cached data or specific entity data',
    'color: #333; font-size: 12px;'
  );
  console.log(
    '%c- emergencyRefresh(): Immediately refreshes critical content bypassing throttling',
    'color: #333; font-size: 12px;'
  );
  console.log(
    '%cExamples:',
    'font-weight: bold; color: #444; font-size: 12px;'
  );
  console.log(
    '%c  refreshCachedData()          // Refresh all data',
    'color: #666; font-family: monospace;'
  );
  console.log(
    '%c  refreshCachedData("articles") // Refresh only articles',
    'color: #666; font-family: monospace;'
  );
  console.log(
    '%c  emergencyRefresh()           // Emergency refresh of critical content',
    'color: #666; font-family: monospace;'
  );
}


