# Image Caching System

## Overview

The Pinky Toe website integrates with Airtable to fetch content including articles, team members, and quotes. One challenge with Airtable is that image attachment URLs expire after a short period. This image caching system solves that problem by:

1. Downloading images from Airtable
2. Storing them locally with content-based hashing
3. Creating mappings between records and their images
4. Providing proxy routes to serve the cached images

## System Components

### 1. Image Service

Located in `server/services/image-service.ts`, this service provides utilities for:

- Extracting attachment data from Airtable records
- Getting optimal URLs from Airtable attachments (preferring thumbnails when available)
- Creating proxy URLs for our Express backend to serve
- Downloading and caching images locally

### 2. Image Routes

Located in `server/routes/images.ts`, this Express router:

- Serves cached images through a proxy route (`/api/images/:id`)
- Implements a cache-then-network strategy that serves cached versions first
- Refreshes images in the background when requested
- Handles proper Content-Type and caching headers

### 3. Client-side Image Helper

Located in `client/src/lib/image-helper.ts`, this utility:

- Provides functions to get usable image URLs
- Handles empty or undefined image sources
- Proxies external URLs through our cache system
- Falls back to a placeholder image when needed

### 4. Caching Scripts

Several scripts are available to manage the image cache:

- `scripts/direct-airtable-cache.js`: Directly connects to Airtable API to download images
- `scripts/refresh-image-cache.js`: Refreshes the cache based on existing mappings
- `scripts/cache-images.js`: Node script for caching images from our API endpoints
- `scripts/cache-images.sh`: Shell script with utilities for managing the cache

## Cache Data Structure

### Folder Structure

- `/uploads/`: Contains all cached images with hash-based filenames
- `/clean_uploads/`: Backup directory for cached images

### Mapping Files

- `image-record-map.json`: Maps Airtable records to their associated images
- `url-to-filename-map.json`: Maps original Airtable URLs to local filenames

## How It Works

### Image Naming Convention

Images are stored with content-based hash names to ensure uniqueness and avoid duplication:

1. A hash is generated from the original Airtable URL using MD5
2. The file extension is preserved based on the content type
3. Example: `01144097f1db643d2c0f2e0f6b3e8170.png`

### Caching Process

1. The caching script identifies tables in Airtable
2. For each table, it retrieves all records
3. It extracts image URLs from attachments and content fields
4. Each image is downloaded and stored with a hash-based filename
5. Mappings are created to link records to their images

### Proxy Mechanism

When a client requests an image:

1. The client uses a URL like `/api/images/[encoded-url]`
2. The server checks if the image exists in cache
3. If found, it serves the cached version immediately
4. In the background, it fetches the latest version from Airtable
5. The cache is updated if the image has changed

## Cache Management

You can manage the image cache using the `scripts/cache-images.sh` tool:

```bash
# Show cache status
./scripts/cache-images.sh status

# Refresh the cache (download missing images only)
./scripts/cache-images.sh refresh

# Force refresh all images
./scripts/cache-images.sh force-refresh

# Create a backup of the current cache
./scripts/cache-images.sh backup

# Restore from backup
./scripts/cache-images.sh restore

# Clear the cache
./scripts/cache-images.sh clear
```

## Troubleshooting

### Missing Images

If images are not appearing:

1. Check if the image exists in the `/uploads/` directory
2. Verify the image is properly referenced in `image-record-map.json`
3. Run `./scripts/cache-images.sh refresh` to attempt to download missing images
4. Check server logs for any errors in the image proxy route

### Expired URLs

Airtable URLs expire after a short period. If you see 403 errors:

1. The caching system should handle this automatically
2. Run `./scripts/cache-images.sh refresh` to refresh the cache
3. Check that the Airtable API key and Base ID are correctly set

### Authorization Issues

If you encounter "Not authorized" errors:

1. Verify the Airtable API key has access to the required base
2. Check that the table names in the script match your Airtable base
3. Ensure the API key has permission to read the tables

## Maintenance

Regular maintenance helps keep the cache up to date:

1. Schedule periodic refreshes using `./scripts/cache-images.sh refresh`
2. Create backups before making changes to the caching system
3. Monitor the size of the cache to ensure it doesn't grow too large

## Statistics

Current cache statistics (as of March 23, 2024):
- 95 cached images
- 75MB total cache size
- 137 records with associated images

## Future Improvements

- Implement cache expiration for unused images
- Add webhook support to refresh images when Airtable data changes
- Create an admin panel for cache management
- Optimize image storage with WebP conversion