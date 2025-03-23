import { Router, Request, Response } from 'express';
import { ImageService } from '../services/image-service';
import fetch from 'node-fetch';
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
imagesRouter.get('/:id', async (req: Request, res: Response) => {
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
      // For other cases (unlikely now that we're using encoded URLs)
      return await handleUrlImage(decodedId, fileHash, res);
    }
    
  } catch (error) {
    console.error('Error serving image:', error);
    return res.status(500).json({ error: 'Failed to serve image' });
  }
});

/**
 * Handle fetching and caching an image from a URL
 */
async function handleUrlImage(url: string, fileHash: string, res: Response) {
  try {
    console.log(`Fetching image from URL: ${url.substring(0, 100)}...`);
    
    // Make sure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    
    // Fetch the image
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return res.status(404).json({ error: `Image not found: ${response.status} ${response.statusText}` });
    }
    
    // Get content type and determine extension
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? '.png' : 
                contentType.includes('gif') ? '.gif' : 
                contentType.includes('webp') ? '.webp' : '.jpg';
    
    console.log(`Image content type: ${contentType}, using extension: ${ext}`);
    
    // Get the image data
    const buffer = await response.buffer();
    
    if (!buffer || buffer.length === 0) {
      console.error('Received empty image buffer');
      return res.status(404).json({ error: 'Received empty image' });
    }
    
    console.log(`Received image: ${buffer.length} bytes`);
    
    // Save the image to disk
    const filepath = path.join(UPLOADS_DIR, `${fileHash}${ext}`);
    fs.writeFileSync(filepath, buffer);
    console.log(`Saved image to: ${filepath}`);
    
    // Serve the image
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.end(buffer);
    
    console.log('Image served successfully');
    
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
 */
async function refreshImageInBackground(id: string, fileHash: string) {
  try {
    console.log(`Refreshing image in background: ${id.substring(0, 100)}...`);
    
    // Make sure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    
    // If the ID is a URL
    const url = id.startsWith('http') ? id : decodeURIComponent(id);
    
    console.log(`Fetching from: ${url.substring(0, 100)}...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to refresh image: ${response.status} ${response.statusText}`);
      return;
    }
    
    // Get content type and determine extension
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? '.png' : 
               contentType.includes('gif') ? '.gif' : 
               contentType.includes('webp') ? '.webp' : '.jpg';
    
    // Get the image data
    const buffer = await response.buffer();
    
    if (!buffer || buffer.length === 0) {
      console.error('Received empty image buffer during refresh');
      return;
    }
    
    // Save the image to disk
    const filepath = path.join(UPLOADS_DIR, `${fileHash}${ext}`);
    fs.writeFileSync(filepath, buffer);
    console.log(`Refreshed and saved image to: ${filepath}`);
    
  } catch (error) {
    // Just log the error, don't interrupt the request flow
    console.error('Error refreshing image in background:', error);
  }
}