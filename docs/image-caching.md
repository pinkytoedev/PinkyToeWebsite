# Image Caching System

This document explains the image caching system implemented for The Pinky Toe website to ensure reliable image loading from Airtable.

## Overview

Airtable image URLs are temporary and expire after a period of time. To solve this problem, we've implemented a comprehensive caching system that:

1. Downloads images from Airtable and stores them locally in the `uploads/` directory
2. Serves cached images when requested, even if the original Airtable URL has expired
3. Periodically refreshes the cache in the background

## Components

The image caching system consists of the following components:

### Server-side Components

- **Image Service** (`server/services/image-service.ts`): Provides utility functions for handling Airtable attachments and image URLs
- **Image Router** (`server/routes/images.ts`): Implements the API endpoint for serving images with cache-then-network approach

### Caching Scripts

- **Direct Airtable Cache** (`scripts/direct-airtable-cache.js`): Directly connects to Airtable API to cache all images
- **Refresh Image Cache** (`scripts/refresh-image-cache.js`): Refreshes the image cache with options for force refresh
- **Cache Shell Script** (`scripts/cache-images.sh`): Provides convenient commands for managing the cache

## How It Works

1. **Image Detection**: The caching scripts scan all tables in Airtable to find fields containing image attachments, URLs in rich text fields, and other image references
2. **Local Storage**: Images are downloaded and stored in the `uploads/` directory with filenames based on a hash of their URL
3. **Serving Images**: When a request is made to `/api/images/:encodedUrl`:
   - The system checks if the image is already cached locally
   - If cached, it serves the local file
   - If not cached, it downloads the image, caches it, and then serves it
   - Optionally refreshes old images in the background

## Usage

### Caching Scripts

```bash
# Refresh the image cache (download missing images)
bash scripts/cache-images.sh refresh

# Force refresh all images (redownload everything)
bash scripts/cache-images.sh force-refresh

# Run the direct Airtable caching script
bash scripts/cache-images.sh direct

# Count the number of cached images
bash scripts/cache-images.sh count

# Clean the cache (move to clean_uploads/ for backup)
bash scripts/cache-images.sh clean
```

### Image URL Handling

In your code, you should use the `ImageService.getProxyUrl()` function to transform Airtable URLs into cached URLs:

```typescript
import { ImageService } from '../services/image-service';

// Convert an Airtable URL to a cached URL
const cachedUrl = ImageService.getProxyUrl(airtableUrl);
```

## Maintenance

The cache should be refreshed periodically to ensure new images are downloaded and old images are updated. We recommend:

1. Running `bash scripts/cache-images.sh refresh` after adding new content to Airtable
2. Running `bash scripts/cache-images.sh force-refresh` occasionally (e.g., monthly) to ensure all images are fresh

## Troubleshooting

If images are not loading correctly:

1. Check the server logs for any errors related to image fetching
2. Verify that the AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables are set correctly
3. Try running `bash scripts/cache-images.sh force-refresh` to redownload all images
4. Verify the images exist in the `uploads/` directory