/**
 * Helper functions for handling image URLs
 */

/**
 * Processes image URLs to ensure they work with the server's image proxy
 * @param url The original image URL
 * @returns Properly formatted URL for the image
 */
export function getImageUrl(url: string | undefined | null | any[]): string {
  // If empty/undefined, use a placeholder
  if (!url) {
    return '/assets/placeholder.jpg';
  }

  // If it's an array (e.g., Airtable returns an array for some fields), use the first item
  if (Array.isArray(url)) {
    return getImageUrl(url[0]) || '/assets/placeholder.jpg';
  }

  // If it's already a local URL or data URL, return as is
  if (url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }

  // If it's an external URL, route through our proxy
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/images/${encodeURIComponent(url)}`;
  }

  // Handle potential Airtable attachment URLs (which are full URLs)
  if (url.includes('amazonaws.com') || url.includes('airtable.com')) {
    return `/api/images/${encodeURIComponent(url)}`;
  }

  return url;
}

/**
 * Gets photo URL with similar logic to image URL
 * @param url The original photo URL
 * @returns Properly formatted URL for the photo
 */
export function getPhotoUrl(url: string | undefined | null | any[]): string {
  // Apply the same logic as getImageUrl
  return getImageUrl(url);
}