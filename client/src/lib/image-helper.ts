/**
 * Helper functions for handling image URLs
 */

/**
 * Gets a usable image URL that handles different image source types
 * - Handles empty or undefined imageUrl
 * - Handles array of authors/images from Airtable
 * - Returns a default placeholder if no image is available
 * - Properly proxies Airtable record IDs and external URLs
 * - Handles Airtable attachment objects with thumbnails
 */
export function getImageUrl(imageUrl: string | undefined | null | any[]): string {
  // If empty/undefined, use a placeholder
  if (!imageUrl) {
    return '/api/images/placeholder';
  }

  // If it's an array (e.g., Airtable returns an array for some fields), use the first item
  if (Array.isArray(imageUrl)) {
    return getImageUrl(imageUrl[0]);
  }

  // Check if it's an Airtable attachment object
  if (typeof imageUrl === 'object' && imageUrl !== null) {
    // If it has a thumbnails field, it's likely an Airtable attachment
    if ('thumbnails' in imageUrl && imageUrl.thumbnails) {
      // Try to extract the best URL from thumbnails
      let attachmentUrl = '';
      
      // Typecasting to any to handle dynamic property access 
      const thumbnails = (imageUrl as any).thumbnails;
      
      if (thumbnails && thumbnails.large && thumbnails.large.url) {
        attachmentUrl = thumbnails.large.url;
      } else if (thumbnails && thumbnails.small && thumbnails.small.url) {
        attachmentUrl = thumbnails.small.url;
      } else if ('url' in imageUrl && imageUrl.url) {
        attachmentUrl = (imageUrl as any).url;
      }
        
      if (attachmentUrl) {
        return `/api/images/${encodeURIComponent(attachmentUrl)}`;
      }
    } 
    // If it has a URL but no thumbnails
    else if ('url' in imageUrl && imageUrl.url) {
      return `/api/images/${encodeURIComponent((imageUrl as any).url)}`;
    }
    
    // If it's an object but not in a format we recognize, try to serialize it
    // This allows the server to attempt parsing and extracting the needed URL
    try {
      return `/api/images/${encodeURIComponent(JSON.stringify(imageUrl))}`;
    } catch (error) {
      console.error('Failed to serialize image object:', error);
      return '/api/images/placeholder';
    }
  }

  // If it's an Airtable record ID (e.g., rec...), apply image proxy
  if (typeof imageUrl === 'string' && imageUrl.startsWith('rec')) {
    return `/api/images/${encodeURIComponent(imageUrl)}`;
  }

  // If the URL is already proxied or is a local path, return it as is
  if (typeof imageUrl === 'string' && (imageUrl.startsWith('/api/images') || imageUrl.startsWith('/'))) {
    return imageUrl;
  }

  // For external URLs, proxy to avoid CORS issues
  if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    return `/api/images/${encodeURIComponent(imageUrl)}`;
  }

  // For any other string value, try to use it via the proxy
  if (typeof imageUrl === 'string') {
    return `/api/images/${encodeURIComponent(imageUrl)}`;
  }

  // Last resort - return placeholder
  return '/api/images/placeholder';
}

/**
 * Helper function for photo fields, which may have a different format
 * than regular image fields in Airtable
 */
export function getPhotoUrl(photo: string | undefined | null | any[]): string {
  return getImageUrl(photo);
}