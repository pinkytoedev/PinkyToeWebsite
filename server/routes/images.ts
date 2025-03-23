import { Router, Request, Response } from 'express';
import { ImageService } from '../services/image-service';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const imagesRouter = Router();

/**
 * Placeholder image endpoint 
 * Serves a SVG placeholder when no image is available
 */
imagesRouter.get('/placeholder', (req: Request, res: Response) => {
  // Create a simple SVG placeholder
  const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="#f0f0f0" />
    <text x="50%" y="50%" font-family="Arial" font-size="20" text-anchor="middle" fill="#666">
      Image Not Available
    </text>
  </svg>`;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.send(svg);
});

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`Created uploads directory at ${UPLOADS_DIR}`);
  }
  
  // Check if directory is writable
  fs.accessSync(UPLOADS_DIR, fs.constants.W_OK);
} catch (error: any) {
  console.error(`Error with uploads directory: ${error?.message || 'Unknown error'}`);
  // We'll continue and handle errors in the routes
}

/**
 * Simple image proxy route that uses cache-then-network approach
 * Responds with cached version first, then fetches updated image in background
 */
imagesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const decodedId = decodeURIComponent(id);
    
    // Generate a consistent filename from the ID
    const fileHash = crypto.createHash('md5').update(decodedId).digest('hex');
    
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
        refreshImageInBackground(decodedId, fileHash);
      }
      
      return;
    }
    
    // Handle Airtable record IDs (starting with 'rec')
    if (decodedId.startsWith('rec')) {
      try {
        // Check if we already have a cached image for this Airtable record
        // If not, generate a placeholder
        const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#f8f9fa" />
          <text x="50%" y="50%" font-family="Arial" font-size="16" text-anchor="middle" fill="#343a40">
            Airtable Image
          </text>
        </svg>`;
        
        try {
          // Save the SVG as a fallback
          const filepath = path.join(UPLOADS_DIR, `${fileHash}.svg`);
          fs.writeFileSync(filepath, svg);
        } catch (writeError: any) {
          console.error('Failed to save SVG placeholder:', writeError);
          // Continue even if write fails
        }
        
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(svg);
      } catch (svgError: any) {
        console.error('Error creating SVG placeholder:', svgError);
        return res.redirect('/api/images/placeholder');
      }
    }
    
    // If it's a URL (http/https)
    if (decodedId.startsWith('http')) {
      return await handleUrlImage(decodedId, fileHash, res);
    } else {
      // For any other type of ID, try to use it as a URL
      // but wrap in try/catch to handle invalid URLs
      try {
        return await handleUrlImage(decodedId, fileHash, res);
      } catch (urlError: any) {
        console.error('Error with URL:', urlError);
        
        // Return placeholder if URL is invalid
        return res.redirect('/api/images/placeholder');
      }
    }
    
  } catch (error: any) {
    console.error('Error serving image:', error);
    return res.redirect('/api/images/placeholder');
  }
});

/**
 * Handle fetching and caching an image from a URL
 */
async function handleUrlImage(url: string, fileHash: string, res: Response) {
  try {
    // Handle invalid URLs
    if (!url || url.startsWith('rec')) {
      console.error(`Invalid URL format: ${url}`);
      return res.redirect('/api/images/placeholder');
    }
    
    // If the URL doesn't start with http/https, add it
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    
    try {
      // Fetch the image
      const response = await fetch(fullUrl);
      if (!response.ok) {
        console.error(`Failed to fetch image: ${fullUrl} (Status: ${response.status})`);
        return res.redirect('/api/images/placeholder');
      }
      
      // Get content type and determine extension
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // Check if it's actually an image
      if (!contentType.startsWith('image/')) {
        console.error(`URL doesn't point to an image: ${fullUrl} (Content-Type: ${contentType})`);
        return res.redirect('/api/images/placeholder');
      }
      
      const ext = contentType.includes('png') ? '.png' : 
                  contentType.includes('gif') ? '.gif' : 
                  contentType.includes('webp') ? '.webp' : '.jpg';
      
      // Save the image
      const buffer = await response.buffer();
      
      try {
        const filepath = path.join(UPLOADS_DIR, `${fileHash}${ext}`);
        fs.writeFileSync(filepath, buffer);
      } catch (writeError: any) {
        console.error('Error writing image to disk:', writeError);
        // Continue anyway to serve the image from memory
      }
      
      // Serve the image
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.end(buffer);
    } catch (fetchError: any) {
      console.error(`Error fetching image from URL: ${fullUrl}`, fetchError);
      return res.redirect('/api/images/placeholder');
    }
  } catch (error: any) {
    console.error('Error handling URL image:', error);
    return res.redirect('/api/images/placeholder');
  }
}

/**
 * Refresh an image in the background without blocking the response
 */
async function refreshImageInBackground(id: string, fileHash: string) {
  // Don't attempt to refresh Airtable record IDs
  if (!id || id.startsWith('rec')) {
    return;
  }
  
  try {
    // If the URL doesn't start with http/https, add it
    const fullUrl = id.startsWith('http') ? id : `https://${id}`;
    
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        console.error(`Failed to refresh image: ${fullUrl} (Status: ${response.status})`);
        return;
      }
      
      // Get content type and determine extension
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // Skip if not an image
      if (!contentType.startsWith('image/')) {
        console.error(`URL doesn't point to an image: ${fullUrl} (Content-Type: ${contentType})`);
        return;
      }
      
      const ext = contentType.includes('png') ? '.png' : 
                 contentType.includes('gif') ? '.gif' : 
                 contentType.includes('webp') ? '.webp' : '.jpg';
      
      try {
        // Save the image
        const buffer = await response.buffer();
        const filepath = path.join(UPLOADS_DIR, `${fileHash}${ext}`);
        fs.writeFileSync(filepath, buffer);
        console.log(`Successfully refreshed image: ${fullUrl}`);
      } catch (writeError) {
        console.error('Error writing refreshed image to disk:', writeError);
      }
    } catch (fetchError) {
      console.error(`Error fetching image: ${fullUrl}`, fetchError);
    }
  } catch (error: any) {
    // Just log the error, don't interrupt the request flow
    console.error('Error refreshing image in background:', error);
  }
}