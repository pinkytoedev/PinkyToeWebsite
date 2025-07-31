/**
 * GitHub Pages version of image helper functions
 * Uses direct URLs instead of proxying through /api/images/
 */

/**
 * Gets a usable image URL for GitHub Pages deployment
 * - Returns direct URLs for external images
 * - Uses placeholder for missing images
 */
// Data URL for placeholder image
const PLACEHOLDER_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmFjOGQyIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iI0ZGNEQ4RCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';

export function getImageUrl(imageUrl: string | undefined | null | any[]): string {
    // If empty/undefined, use a placeholder
    if (!imageUrl) {
        return PLACEHOLDER_DATA_URL;
    }

    // If it's an array (e.g., Airtable returns an array for some fields), use the first item
    if (Array.isArray(imageUrl)) {
        return getImageUrl(imageUrl[0]);
    }

    // Handle URLs that are already encoded with /api/images/ prefix
    if (typeof imageUrl === 'string' && imageUrl.startsWith('/api/images/')) {
        // Extract the encoded URL and decode it
        const encodedUrl = imageUrl.replace('/api/images/', '');
        try {
            const decodedUrl = decodeURIComponent(encodedUrl);
            // If it's a valid HTTP/HTTPS URL, use it directly
            if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
                return decodedUrl;
            }
        } catch (e) {
            console.warn('Failed to decode image URL:', encodedUrl);
        }
        // If decoding fails, fall back to placeholder
        return PLACEHOLDER_DATA_URL;
    }

    // For Airtable record IDs, we can't proxy them on GitHub Pages
    if (typeof imageUrl === 'string' && imageUrl.startsWith('rec')) {
        return PLACEHOLDER_DATA_URL;
    }

    // If it's already a direct URL, use it as is
    if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        return imageUrl;
    }

    // If it's a local path, keep it as is
    if (typeof imageUrl === 'string' && imageUrl.startsWith('/')) {
        return imageUrl;
    }

    // Return the URL as is (fallback)
    return imageUrl || PLACEHOLDER_DATA_URL;
}

export function getPhotoUrl(photo: string | undefined | null | any[]): string {
    return getImageUrl(photo);
}