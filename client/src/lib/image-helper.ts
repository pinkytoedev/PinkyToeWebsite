/**
 * Helper functions for handling image URLs
 */

/**
 * Gets a usable image URL that handles different image source types
 * - Handles empty or undefined imageUrl
 * - Handles array of authors/images from Airtable
 * - Returns a default placeholder if no image is available
 * - Properly proxies Airtable record IDs and external URLs
 * - Ensures full-size images for postimg.cc URLs
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

  // If it's an Airtable record ID (e.g., rec...), apply image proxy
  if (typeof imageUrl === 'string' && imageUrl.startsWith('rec')) {
    return `/api/images/${encodeURIComponent(imageUrl)}`;
  }

  // If the URL is already proxied or is a local path, return it as is
  if (typeof imageUrl === 'string' && (imageUrl.startsWith('/api/images') || imageUrl.startsWith('/'))) {
    return imageUrl;
  }

  // Special handling for PostImg URLs to ensure we get full-size images
  if (typeof imageUrl === 'string' && imageUrl.includes('postimg.cc')) {
    // Our server will extract the full-size URL from gallery pages
    const proxyUrl = `/api/images/${encodeURIComponent(imageUrl)}`;
    console.log(`Proxying PostImg URL: ${imageUrl} → ${proxyUrl}`);
    return proxyUrl;
  }

  // For external URLs, proxy to avoid CORS issues
  if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    return `/api/images/${encodeURIComponent(imageUrl)}`;
  }

  // Return the URL as is
  return imageUrl;
}

export function getPhotoUrl(photo: string | undefined | null | any[]): string {
  return getImageUrl(photo);
}