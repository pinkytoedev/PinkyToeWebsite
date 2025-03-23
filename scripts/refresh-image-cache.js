/**
 * Refresh Image Cache Script
 * 
 * This script provides a convenient way to refresh the local image cache
 * from Airtable images. It's designed to be run manually when new content
 * is added or existing content is updated in Airtable.
 * 
 * Usage: node scripts/refresh-image-cache.js [--force]
 * Options:
 *   --force  Force refresh all images, even if they're already cached
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Check if we need to force refresh
const forceRefresh = process.argv.includes('--force');

// Create clean_uploads directory if it doesn't exist
const CLEAN_UPLOADS_DIR = path.join(process.cwd(), 'clean_uploads');
if (!fs.existsSync(CLEAN_UPLOADS_DIR)) {
  fs.mkdirSync(CLEAN_UPLOADS_DIR, { recursive: true });
}

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Main function
async function refreshImageCache() {
  console.log('Starting image cache refresh...');
  
  if (forceRefresh) {
    console.log('Force refresh enabled - all images will be downloaded again');
    
    // Backup existing images just to be safe
    console.log('Backing up existing images...');
    const existingFiles = fs.readdirSync(UPLOADS_DIR);
    
    // Copy each file to clean_uploads as backup
    existingFiles.forEach(file => {
      if (!fs.existsSync(path.join(CLEAN_UPLOADS_DIR, file))) {
        fs.copyFileSync(
          path.join(UPLOADS_DIR, file),
          path.join(CLEAN_UPLOADS_DIR, file)
        );
      }
    });
    
    console.log(`Backed up ${existingFiles.length} images to ${CLEAN_UPLOADS_DIR}`);
    
    // Clear uploads directory for fresh download
    existingFiles.forEach(file => {
      fs.unlinkSync(path.join(UPLOADS_DIR, file));
    });
    
    console.log('Cleared uploads directory for fresh download');
  }
  
  // Run the direct Airtable caching script
  console.log('Running direct Airtable caching script...');
  try {
    execSync('node scripts/direct-airtable-cache.js', { stdio: 'inherit' });
    console.log('Image cache refresh completed successfully!');
  } catch (error) {
    console.error('Error running caching script:', error);
    
    // If we cleared the uploads directory but failed to download new images,
    // restore the backup to prevent data loss
    if (forceRefresh) {
      console.log('Restoring image backup due to error...');
      const backupFiles = fs.readdirSync(CLEAN_UPLOADS_DIR);
      
      backupFiles.forEach(file => {
        if (!fs.existsSync(path.join(UPLOADS_DIR, file))) {
          fs.copyFileSync(
            path.join(CLEAN_UPLOADS_DIR, file),
            path.join(UPLOADS_DIR, file)
          );
        }
      });
      
      console.log(`Restored ${backupFiles.length} images from backup`);
    }
  }
  
  // Count cached images
  const cachedFiles = fs.readdirSync(UPLOADS_DIR);
  console.log(`Total cached images: ${cachedFiles.length}`);
}

// Run the script
refreshImageCache();