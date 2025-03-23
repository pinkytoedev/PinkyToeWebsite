#!/bin/bash

# Image Cache Management Script
# This script provides a convenient interface to manage the image caching system

# Check the command
if [ "$1" == "refresh" ]; then
  # Run the refresh script
  echo "Refreshing image cache..."
  node scripts/refresh-image-cache.js
elif [ "$1" == "force-refresh" ]; then
  # Run the refresh script with force flag
  echo "Forcing refresh of all images..."
  node scripts/refresh-image-cache.js --force
elif [ "$1" == "direct" ]; then
  # Run the direct caching script
  echo "Running direct Airtable cache..."
  node scripts/direct-airtable-cache.js
elif [ "$1" == "count" ]; then
  # Count the cached images
  echo "Counting cached images..."
  find uploads -type f | wc -l
elif [ "$1" == "clean" ]; then
  # Clean the cache (move to clean_uploads for backup)
  echo "Cleaning cache (with backup)..."
  
  # Create clean_uploads directory if it doesn't exist
  mkdir -p clean_uploads
  
  # Move all files from uploads to clean_uploads
  find uploads -type f -exec mv {} clean_uploads/ \;
  
  echo "Done. All images moved to clean_uploads/ directory."
else
  # Print usage information
  echo "Image Cache Management Tool"
  echo ""
  echo "Usage: bash scripts/cache-images.sh [command]"
  echo ""
  echo "Commands:"
  echo "  refresh         Refresh the image cache (download missing images)"
  echo "  force-refresh   Force refresh all images (redownload everything)"
  echo "  direct          Run the direct Airtable caching script"
  echo "  count           Count the number of cached images"
  echo "  clean           Move all cached images to clean_uploads/ (backup)"
  echo ""
  echo "Example: bash scripts/cache-images.sh refresh"
fi