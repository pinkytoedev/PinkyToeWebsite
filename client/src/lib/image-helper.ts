/**
 * Helper functions for handling image URLs
 */

// Local fallback image path instead of external placeholder URL
const LOCAL_FALLBACK_IMAGE = '/assets/placeholder-image.svg';

/**
 * Gets a usable image URL that handles different image source types
 * - Handles empty or undefined imageUrl
 * - Handles array of authors/images from Airtable
 * - Returns a default placeholder if no image is available
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
    return `/api/images/${encodeURIComponent(url)}`;
  }
  
  return url;
}

export function getPhotoUrl(photo: string | undefined | null | any[]): string {
  return getImageUrl(photo);
}