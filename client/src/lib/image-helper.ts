/**
 * Helper functions for handling image URLs
 * 
 * This module provides utilities for working with images in the Pinky Toe website,
 * handling various image source formats and maintaining a local cache to prevent
 * issues with Airtable's expiring URLs.
 */

// Local fallback image path instead of external placeholder URL
const LOCAL_FALLBACK_IMAGE = '/assets/placeholder-image.svg';

// Path to the uploads directory for direct access to cached images
const UPLOADS_PATH = '/uploads/';

/**
 * Cache of URL-to-filename mappings
 * This will be populated lazily when needed through fetchUrlToFilenameMap()
 */
let urlToFilenameMap: Record<string, string> | null = null;
let urlMapLoadPromise: Promise<Record<string, string>> | null = null;

/**
 * Asynchronously loads the URL-to-filename mapping
 * This allows the client to directly access cached images without going through the proxy
 */
async function fetchUrlToFilenameMap(): Promise<Record<string, string>> {
  if (urlToFilenameMap) {
    return urlToFilenameMap;
  }

  if (urlMapLoadPromise) {
    return await urlMapLoadPromise;
  }

  // Create a promise to load the mapping
  urlMapLoadPromise = fetch('/url-to-filename-map.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load URL mapping: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      urlToFilenameMap = data;
      return data;
    })
    .catch(error => {
      console.error('Error loading URL to filename map:', error);
      return {}; // Return empty object on error
    });

  return await urlMapLoadPromise;
}

/**
 * Gets a direct path to the locally cached image if available
 * This avoids the proxy overhead when we already have the image cached
 */
async function getDirectCachedPath(url: string): Promise<string | null> {
  try {
    const map = await fetchUrlToFilenameMap();
    const filename = map[url];
    
    if (filename) {
      return `${UPLOADS_PATH}${filename}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached path:', error);
    return null;
  }
}

/**
 * Gets a usable image URL that handles different image source types
 * - Handles empty or undefined imageUrl
 * - Handles array of authors/images from Airtable
 * - Returns a default placeholder if no image is available
 * - Attempts to use cached local files when available
 */
export function getImageUrl(imageUrl: string | undefined | null | any[]): string {
  // If empty/undefined, use a local fallback
  if (!imageUrl) {
    return LOCAL_FALLBACK_IMAGE;
  }

  // If it's an array (e.g., Airtable returns an array for some fields), use the first item
  if (Array.isArray(imageUrl)) {
    // If the array is empty or undefined, use a local fallback
    if (!imageUrl.length) {
      return LOCAL_FALLBACK_IMAGE;
    }
    
    // If the array contains objects with URL properties (Airtable attachments)
    if (typeof imageUrl[0] === 'object' && imageUrl[0] !== null) {
      // Try to extract URL from Airtable attachment format
      const attachment = imageUrl[0] as any;
      if (attachment.url) {
        return proxyExternalUrl(attachment.url);
      } else if (attachment.thumbnails && attachment.thumbnails.large) {
        return proxyExternalUrl(attachment.thumbnails.large.url);
      }
    }
    
    // If it's just a string in an array
    return proxyExternalUrl(imageUrl[0]);
  }

  // If the URL is already proxied or is a local path, return it as is
  if (typeof imageUrl === 'string' && (imageUrl.startsWith('/api/images/') || imageUrl.startsWith('/'))) {
    return imageUrl;
  }

  // For external URLs, always proxy to avoid CORS issues and handle Airtable's expiring URLs
  if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    return proxyExternalUrl(imageUrl);
  }
  
  // If it looks like an Airtable ID (e.g. "recXXXXXX"), don't try to process it
  // Our server will return the placeholder image when it gets a non-URL ID
  if (typeof imageUrl === 'string' && imageUrl.startsWith('rec') && imageUrl.length === 17) {
    return LOCAL_FALLBACK_IMAGE;
  }

  // If it's an object (Airtable attachment), extract the URL
  if (typeof imageUrl === 'object' && imageUrl !== null) {
    const attachment = imageUrl as any;
    if (attachment.url) {
      return proxyExternalUrl(attachment.url);
    } else if (attachment.thumbnails && attachment.thumbnails.large) {
      return proxyExternalUrl(attachment.thumbnails.large.url);
    }
  }

  // Return the URL as is if we can't handle it
  return typeof imageUrl === 'string' ? imageUrl : LOCAL_FALLBACK_IMAGE;
}

/**
 * Helper function to proxy external URLs through our image proxy
 * Tries to use cached versions first when available
 */
function proxyExternalUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return LOCAL_FALLBACK_IMAGE;
  }
  
  // If it's already proxied, return it as is
  if (url.startsWith('/api/images/')) {
    return url;
  }
  
  // Only proxy http/https URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Start loading the URL mapping in the background
    // We don't await this since we need a synchronous return
    fetchUrlToFilenameMap().then(map => {
      // If this URL is already in our map, we could potentially update
      // the DOM with the direct path in a future enhancement
    }).catch(() => {
      // Silently fail - we'll use the proxy URL as fallback
    });
    
    // Return the proxy URL synchronously
    return `/api/images/${encodeURIComponent(url)}`;
  }
  
  return url;
}

/**
 * Async version of getImageUrl that can use the cached URL mapping
 * This can provide better performance by avoiding the proxy when possible
 */
export async function getImageUrlAsync(imageUrl: string | undefined | null | any[]): Promise<string> {
  // For empty/null/array cases, delegate to the sync version
  if (!imageUrl || Array.isArray(imageUrl) || typeof imageUrl === 'object') {
    return getImageUrl(imageUrl);
  }
  
  // Only try to optimize string URLs
  if (typeof imageUrl === 'string') {
    // If it's already a local path, return as is
    if (imageUrl.startsWith('/') && !imageUrl.startsWith('/api/images/')) {
      return imageUrl;
    }
    
    // For http URLs, check if we have a cached version
    if (imageUrl.startsWith('http')) {
      try {
        const directPath = await getDirectCachedPath(imageUrl);
        if (directPath) {
          return directPath;
        }
      } catch {
        // On any error, fall back to proxy
      }
      
      // Fall back to the proxy
      return `/api/images/${encodeURIComponent(imageUrl)}`;
    }
  }
  
  // For all other cases, use the sync version
  return getImageUrl(imageUrl);
}

/**
 * Alias for getImageUrl to maintain API compatibility
 */
export function getPhotoUrl(photo: string | undefined | null | any[]): string {
  return getImageUrl(photo);
}