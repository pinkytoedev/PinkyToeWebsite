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
    
    // Generate a consistent filename from the ID
    const fileHash = crypto.createHash('md5').update(id).digest('hex');
    
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
      
      // After sending cached response, fetch fresh version in background if old
      const stats = fs.statSync(cachedPath);
      const fileAge = Date.now() - stats.mtimeMs;
      
      // If file is more than a day old, refresh in background
      if (fileAge > 24 * 60 * 60 * 1000) {
        refreshImageInBackground(id, fileHash);
      }
      
      return;
    }
    
    // If no cached version, we need to fetch it
    // First check if this is an Airtable ID (att...) or a URL encoded as ID
    if (id.startsWith('http')) {
      // ID is an encoded URL (for non-Airtable images)
      return await handleUrlImage(id, fileHash, res);
    } else {
      // We'll assume this is a direct URL pointing to an image
      const imageUrl = decodeURIComponent(id);
      return await handleUrlImage(imageUrl, fileHash, res);
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
    // Fetch the image
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Get content type and determine extension
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? '.png' : 
                contentType.includes('gif') ? '.gif' : 
                contentType.includes('webp') ? '.webp' : '.jpg';
    
    // Save the image
    const buffer = await response.buffer();
    const filepath = path.join(UPLOADS_DIR, `${fileHash}${ext}`);
    fs.writeFileSync(filepath, buffer);
    
    // Serve the image
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.end(buffer);
    
  } catch (error) {
    console.error('Error handling URL image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
}

/**
 * Refresh an image in the background without blocking the response
 */
async function refreshImageInBackground(id: string, fileHash: string) {
  try {
    // Check if this is a URL
    if (id.startsWith('http')) {
      const url = id;
      const response = await fetch(url);
      if (!response.ok) return;
      
      // Get content type and determine extension
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('png') ? '.png' : 
                 contentType.includes('gif') ? '.gif' : 
                 contentType.includes('webp') ? '.webp' : '.jpg';
      
      // Save the image
      const buffer = await response.buffer();
      const filepath = path.join(UPLOADS_DIR, `${fileHash}${ext}`);
      fs.writeFileSync(filepath, buffer);
    } else {
      // For non-URL IDs (implement specific logic here)
      const url = decodeURIComponent(id);
      const response = await fetch(url);
      if (!response.ok) return;
      
      // Get content type and determine extension
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('png') ? '.png' : 
                 contentType.includes('gif') ? '.gif' : 
                 contentType.includes('webp') ? '.webp' : '.jpg';
      
      // Save the image
      const buffer = await response.buffer();
      const filepath = path.join(UPLOADS_DIR, `${fileHash}${ext}`);
      fs.writeFileSync(filepath, buffer);
    }
  } catch (error) {
    // Just log the error, don't interrupt the request flow
    console.error('Error refreshing image in background:', error);
  }
}