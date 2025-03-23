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
    return 'https://images.unsplash.com/photo-1533562669260-350775484a52?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
  }
  
  // If it's an array (e.g., Airtable returns an array for some fields), use the first item
  if (Array.isArray(imageUrl)) {
    return imageUrl[0] || 'https://images.unsplash.com/photo-1533562669260-350775484a52?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';
  }
  
  // Return the URL as is
  return imageUrl;
}

/**
 * Gets the photo URL, handling different data formats
 */
export function getPhotoUrl(photo: string | undefined | null | any[]): string {
  return getImageUrl(photo);
}