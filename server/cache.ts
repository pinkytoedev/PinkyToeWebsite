import NodeCache from 'node-cache';

// Initialize cache with standard TTL of 5 minutes and check period of 1 minute
export const apiCache = new NodeCache({
  stdTTL: 300, // 5 minutes in seconds
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Don't clone objects (important for large objects)
});

// Debug function to log cache statistics
export function logCacheStats() {
  const stats = apiCache.getStats();
  console.log('Cache Stats:', {
    keys: apiCache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    ksize: stats.ksize,
    vsize: stats.vsize,
  });
}

// Cache middleware for Express routes
export function cacheMiddleware(ttl: number = 300) { // Default TTL: 5 minutes
  return (req: any, res: any, next: any) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create a cache key from the URL and any query parameters
    const key = req.originalUrl || req.url;
    
    // Try to get the cached response
    const cachedResponse = apiCache.get(key);
    
    if (cachedResponse) {
      console.log(`Cache HIT for ${key}`);
      
      // Return the cached response
      return res.send(cachedResponse);
    }

    // If not in cache, capture the response to cache it
    console.log(`Cache MISS for ${key}`);
    
    // Store the original send function
    const originalSend = res.send;
    
    // Override the send function to cache the response before sending
    res.send = function(body: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Cache the response
        apiCache.set(key, body, ttl);
        console.log(`Cached response for ${key} (${typeof body === 'string' ? body.length : 'non-string'} bytes)`);
      }
      
      // Call the original send function
      return originalSend.call(this, body);
    };
    
    next();
  };
}

// Function to manually clear all cache or a specific key
export function clearCache(key?: string) {
  if (key) {
    apiCache.del(key);
    console.log(`Cleared cache for key: ${key}`);
  } else {
    apiCache.flushAll();
    console.log('Cleared all cache');
  }
}