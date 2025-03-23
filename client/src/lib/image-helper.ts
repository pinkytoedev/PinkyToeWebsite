/**
 * Helper functions for handling image URLs
 */

/**
 * Gets a usable image URL that handles different image source types
 * - Handles empty or undefined imageUrl
 * - Handles array of authors/images from Airtable
 * - Returns a default placeholder if no image is available
 */
export function getImageUrl(imageUrl: string | undefined | null | any[]): string {
  // If empty/undefined, use a placeholder
  if (!imageUrl) {
    return 'https://via.placeholder.com/400x300?text=Image+Not+Available';
  }

  // If it's an array (e.g., Airtable returns an array for some fields), use the first item
  if (Array.isArray(imageUrl)) {
    return imageUrl[0] || 'https://via.placeholder.com/400x300?text=Image+Not+Available';
  }

  // If the URL is already proxied or is a local path, return it as is
  if (typeof imageUrl === 'string' && (imageUrl.startsWith('/api/images') || imageUrl.startsWith('/'))) {
    return imageUrl;
  }

  // For external URLs, consider proxying to avoid CORS issues
  if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    // You can uncomment this if you have a proxy API set up
    // return `/api/images/proxy?url=${encodeURIComponent(imageUrl)}`;
    return imageUrl;
  }

  // Return the URL as is
  return imageUrl;
}

export function getPhotoUrl(photo: string | undefined | null | any[]): string {
  return getImageUrl(photo);
}