import { Router, Request, Response as ExpressResponse } from 'express';
import { ImageService } from '../services/image-service';
import fetch, { Response as FetchResponse } from 'node-fetch';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const imagesRouter = Router();

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Simple image proxy route that uses cache-then-network approach
 * Responds with cached version first, then fetches updated image in background
 */
imagesRouter.get('/:id', async (req: Request, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    
    // Decode the URL parameter (it's encoded from the client)
    const decodedId = decodeURIComponent(id);
    
    // Generate a consistent filename from the decoded ID
    const fileHash = crypto.createHash('md5').update(decodedId).digest('hex');
    
    // Make sure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    
    // Look for cached version first
    const cachedFiles = fs.readdirSync(UPLOADS_DIR).filter(f => f.startsWith(fileHash));
    if (cachedFiles.length > 0) {
      // Use the cached file
      const cachedFile = cachedFiles[0];
      const ext = path.extname(cachedFile);
      const contentType = ext === '.png' ? 'image/png' : 
                          ext === '.gif' ? 'image/gif' : 
                          ext === '.webp' ? 'image/webp' : 'image/jpeg';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      // Stream the file
      const cachedPath = path.join(UPLOADS_DIR, cachedFile);
      fs.createReadStream(cachedPath).pipe(res);
      
      console.log(`Serving cached image: ${cachedPath}`);
      
      // After sending cached response, fetch fresh version in background if old
      const stats = fs.statSync(cachedPath);
      const fileAge = Date.now() - stats.mtimeMs;
      
      // If file is more than a day old, refresh in background
      if (fileAge > 24 * 60 * 60 * 1000) {
        refreshImageInBackground(decodedId, fileHash);
      }
      
      return;
    }
    
    console.log(`No cached version of ${decodedId}, fetching...`);
    
    // If no cached version, we need to fetch it
    // Check if the ID is a URL (which is the most common case now)
    if (decodedId.startsWith('http')) {
      // ID is a URL to an external image
      return await handleUrlImage(decodedId, fileHash, res);
    } else {
      // The ID is not a URL - this is likely an Airtable ID or other non-URL identifier
      // We can't fetch this directly, so return a 404
      console.error(`Cannot fetch non-URL image ID: ${decodedId}`);
      return res.status(404).sendFile(path.join(process.cwd(), 'client/public/assets/placeholder-image.svg'));
    }
    
  } catch (error) {
    console.error('Error serving image:', error);
    return res.status(500).json({ error: 'Failed to serve image' });
  }
});

/**
 * Handle fetching and caching an image from a URL
 * Uses the enhanced ImageService that automatically updates mapping files
 */
async function handleUrlImage(url: string, fileHash: string, res: ExpressResponse) {
  try {
    console.log(`Fetching image from URL: ${url.substring(0, 100)}...`);
    
    // Make sure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    
    try {
      // Try to get content type to determine proper MIME type for response
      const contentType = await ImageService.getContentType(url) || 'image/jpeg';
      
      // Use our enhanced ImageService to fetch and cache the image
      // This handles all the file saving and mapping updates
      const filepath = await ImageService.fetchAndCacheImage(url, fileHash);
      
      // Stream the file back to the client
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      fs.createReadStream(filepath).pipe(res);
      
      console.log(`Image served successfully from: ${filepath}`);
    } catch (fetchError) {
      console.error(`Error fetching image: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      return res.status(404).sendFile(path.join(process.cwd(), 'client/public/assets/placeholder-image.svg'));
    }
    
  } catch (error) {
    console.error('Error handling URL image:', error);
    
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: 'Failed to fetch image', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      });
    }
    
    return res.status(500).json({ error: 'Failed to fetch image' });
  }
}

/**
 * Refresh an image in the background without blocking the response
 * Uses the enhanced ImageService for automatic mapping updates
 */
async function refreshImageInBackground(id: string, fileHash: string) {
  try {
    console.log(`Refreshing image in background: ${id.substring(0, 100)}...`);
    
    // Make sure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    
    // Only proceed with refresh if it's a URL
    if (!id.startsWith('http')) {
      console.log(`Skipping refresh for non-URL ID: ${id}`);
      return;
    }
    
    // Use our enhanced ImageService to refresh the image
    // This will automatically update the URL-to-filename mapping
    const url = id;
    await ImageService.fetchAndCacheImage(url, fileHash);
    console.log(`Refreshed image successfully.`);
    
  } catch (error) {
    // Just log the error, don't interrupt the request flow
    console.error('Error refreshing image in background:', error);
  }
}