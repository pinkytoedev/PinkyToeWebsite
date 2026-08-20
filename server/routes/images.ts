import { Router, Request, Response } from 'express';
import { ImageService } from '../services/image-service';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  fetchImage,
  validateImageUrl,
  ImageFetchError,
  extensionForContentType,
  contentTypeForExtension,
} from '../utils/safe-image-fetch';

export const imagesRouter = Router();

/**
 * Find a cached image for a hash.
 *
 * Rate-limited SVG placeholders are stored as `<hash>_ratelimited.svg` and are
 * deliberately excluded: they are a temporary failure marker with their own
 * expiry handling, not a cached copy of the image.
 */
function findCachedImage(fileHash: string): string | null {
  try {
    const match = fs
      .readdirSync(UPLOADS_DIR)
      .find(f => f.startsWith(fileHash) && !f.includes('_ratelimited'));

    return match ?? null;
  } catch (error) {
    console.error('Error reading uploads directory:', error);
    return null;
  }
}

/**
 * Stream a cached file, falling back to the placeholder if the read fails
 * (the file can be unlinked between the directory scan and the open).
 */
function streamCachedImage(cachedPath: string, res: Response, maxAge = 86400): void {
  res.setHeader('Content-Type', contentTypeForExtension(path.extname(cachedPath)));
  res.setHeader('Cache-Control', `public, max-age=${maxAge}`);

  const stream = fs.createReadStream(cachedPath);
  stream.on('error', error => {
    console.error(`Error streaming cached image ${cachedPath}:`, error);
    if (!res.headersSent) {
      res.redirect('/api/images/placeholder');
    } else {
      res.end();
    }
  });

  stream.pipe(res);
}

/**
 * Placeholder image endpoint 
 * Serves a SVG placeholder when no image is available
 */
imagesRouter.get('/placeholder', (req: Request, res: Response) => {
  // Create a nicer SVG placeholder
  const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="#fdf2f8" />
    <rect width="400" height="60" y="120" fill="#ec4899" fill-opacity="0.8" />
    <text x="50%" y="155" font-family="Arial" font-size="18" text-anchor="middle" fill="#ffffff">
      Image Not Available
    </text>
    <path d="M200 85 L230 115 L200 145 L170 115 Z" fill="#ec4899" fill-opacity="0.5" />
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
    const cachedFile = findCachedImage(fileHash);
    if (cachedFile) {
      const cachedPath = path.join(UPLOADS_DIR, cachedFile);
      streamCachedImage(cachedPath, res);

      // After sending cached response, fetch fresh version in background if old
      try {
        const fileAge = Date.now() - fs.statSync(cachedPath).mtimeMs;
        if (fileAge > 24 * 60 * 60 * 1000) {
          refreshImageInBackground(decodedId, fileHash);
        }
      } catch (statError) {
        console.error(`Error checking age of ${cachedPath}:`, statError);
      }

      return;
    }

    // Handle Airtable record IDs (starting with 'rec')
    if (decodedId.startsWith('rec')) {
      try {
        console.log(`Processing Airtable record ID: ${decodedId}`);
        
        // For Airtable record IDs, we fallback to a placeholder since we don't have direct access
        // to fetch the image from Airtable's API. In production, you would implement this by
        // using the Airtable API to fetch the actual image.
        
        // If this is a MainImage field Airtable record ID
        const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#fdf2f8" />
          <rect width="400" height="60" y="120" fill="#ec4899" fill-opacity="0.8" />
          <text x="50%" y="155" font-family="Arial" font-size="16" text-anchor="middle" fill="#ffffff">
            Image ID: ${decodedId.substring(0, 8)}...
          </text>
          <path d="M200 85 L230 115 L200 145 L170 115 Z" fill="#ec4899" fill-opacity="0.5" />
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
        console.error('Error handling Airtable record ID:', svgError);
        return res.redirect('/api/images/placeholder');
      }
    }
    
    // Special handling for Imgur URLs
    if (decodedId.includes('imgur.com')) {
      // Check if it's a direct i.imgur.com link or an album link
      if (!decodedId.includes('i.imgur.com') && decodedId.includes('/a/')) {
        console.log('Processing Imgur album link:', decodedId);
        // For album links, redirect to placeholder since we can't grab the image directly
        return res.redirect('/api/images/placeholder');
      }

      // For direct Imgur links, try to use cached version more aggressively due to rate limiting
      console.log('Processing Imgur URL:', decodedId);
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
 * Build the "Imgur rate limited" placeholder SVG for a URL.
 */
function buildRateLimitedSvg(fullUrl: string): string {
  let imgurId = 'unknown';
  if (fullUrl.includes('i.imgur.com/')) {
    imgurId = fullUrl.split('i.imgur.com/')[1].split('.')[0];
  }

  return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="#fdf2f8" />
    <rect width="400" height="90" y="105" fill="#ec4899" fill-opacity="0.8" />
    <text x="50%" y="135" font-family="Arial" font-size="16" text-anchor="middle" fill="#ffffff">
      Imgur Image: ${imgurId}
    </text>
    <text x="50%" y="160" font-family="Arial" font-size="14" text-anchor="middle" fill="#ffffff">
      (Rate Limited - Try Again Later)
    </text>
    <text x="50%" y="185" font-family="Arial" font-size="12" text-anchor="middle" fill="#ffffff">
      Imgur limits to 520 requests/hour
    </text>
    <path d="M200 55 L230 85 L200 115 L170 85 Z" fill="#ec4899" fill-opacity="0.5" />
  </svg>`;
}

/**
 * Persist the rate-limited marker so we stop hammering a throttled upstream.
 */
function writeRateLimitedPlaceholder(fileHash: string, svg: string): void {
  try {
    fs.writeFileSync(path.join(UPLOADS_DIR, `${fileHash}_ratelimited.svg`), svg);
  } catch (writeError: any) {
    console.error('Failed to save SVG placeholder:', writeError);
  }
}

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

    // Reject anything outside the allowlist before doing any work. Without this
    // the proxy will fetch whatever the caller names, including internal hosts.
    if (!validateImageUrl(fullUrl)) {
      console.warn(`Blocked proxy request for non-allowlisted URL: ${fullUrl}`);
      return res.redirect('/api/images/placeholder');
    }

    // First check for rate-limited placeholder
    // This helps us avoid repeatedly hitting rate-limited services (especially Imgur)
    const rateLimitedPath = path.join(UPLOADS_DIR, `${fileHash}_ratelimited.svg`);
    if (fs.existsSync(rateLimitedPath)) {
      // If we have a rate-limited placeholder, check its age
      const stats = fs.statSync(rateLimitedPath);
      const fileAge = Date.now() - stats.mtimeMs;

      // Use the rate-limited placeholder for 1 hour to avoid overwhelming Imgur
      if (fileAge < 60 * 60 * 1000) { // 1 hour
        console.log(`Using rate-limited placeholder for ${fullUrl} (age: ${Math.round(fileAge/1000)}s)`);
        streamCachedImage(rateLimitedPath, res, 1800);
        return;
      } else {
        // If the placeholder is old, delete it so we can try fetching again
        try {
          fs.unlinkSync(rateLimitedPath);
          console.log(`Removed stale rate-limited placeholder for ${fullUrl}`);
        } catch (unlinkError) {
          console.error('Error removing stale placeholder:', unlinkError);
        }
      }
    }
    
    try {
      // Special handling for Imgur URLs to respect rate limits
      let shouldThrottle = false;
      if (fullUrl.includes('imgur.com')) {
        // Check if we've hit Imgur in the last 5 seconds
        const imgurLastFetchFile = path.join(UPLOADS_DIR, 'imgur_last_fetch.txt');
        try {
          if (fs.existsSync(imgurLastFetchFile)) {
            const lastFetchTime = parseInt(fs.readFileSync(imgurLastFetchFile, 'utf8'));
            const timeSinceLastFetch = Date.now() - lastFetchTime;
            
            // If we hit Imgur within the last 5 seconds, introduce a delay
            if (timeSinceLastFetch < 5000) {
              shouldThrottle = true;
              const delayMs = 5000 - timeSinceLastFetch;
              console.log(`Throttling Imgur request for ${fullUrl} by ${delayMs}ms`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
          
          // Update last fetch time
          fs.writeFileSync(imgurLastFetchFile, Date.now().toString());
        } catch (throttleError) {
          console.error('Error with Imgur throttling:', throttleError);
          // Continue anyway
        }
      }
      
      // Fetch the image through the allowlisted, size- and time-bounded client.
      console.log(`Fetching image: ${fullUrl}`);
      const { buffer, contentType } = await fetchImage(fullUrl);

      const ext = extensionForContentType(contentType);

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
      const status = fetchError instanceof ImageFetchError ? fetchError.status : undefined;

      // Handle rate limiting (429) specially
      if (status === 429) {
        console.error(`Rate limited when fetching image: ${fullUrl}`);

        // If this is an Imgur URL, create a special placeholder for it
        if (fullUrl.includes('imgur.com')) {
          const svg = buildRateLimitedSvg(fullUrl);
          writeRateLimitedPlaceholder(fileHash, svg);

          res.setHeader('Content-Type', 'image/svg+xml');
          res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
          return res.send(svg);
        }
        
        // For non-Imgur rate limited requests, redirect to placeholder
        return res.redirect('/api/images/placeholder');
      }

      console.error(`Error fetching image from URL: ${fullUrl}`, fetchError?.message || fetchError);
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
  
  // Check if we've recently had rate limit issues with this image
  const rateLimitedMarker = path.join(UPLOADS_DIR, `${fileHash}_ratelimited.svg`);
  if (fs.existsSync(rateLimitedMarker)) {
    const fileAge = Date.now() - fs.statSync(rateLimitedMarker).mtimeMs;

    // Skip refresh if rate limited recently (within last 30 minutes)
    if (fileAge < 30 * 60 * 1000) {
      console.log(`Skipping refresh for rate-limited image: ${id}`);
      return;
    }
  }
  
  try {
    // If the URL doesn't start with http/https, add it
    const fullUrl = id.startsWith('http') ? id : `https://${id}`;
    
    // For Imgur URLs, apply additional throttling
    if (fullUrl.includes('imgur.com')) {
      // Check if we've hit Imgur in the last 5 seconds
      const imgurLastFetchFile = path.join(UPLOADS_DIR, 'imgur_last_fetch.txt');
      try {
        if (fs.existsSync(imgurLastFetchFile)) {
          const lastFetchTime = parseInt(fs.readFileSync(imgurLastFetchFile, 'utf8'));
          const timeSinceLastFetch = Date.now() - lastFetchTime;
          
          // If we hit Imgur within the last 10 seconds in background mode, skip this refresh
          if (timeSinceLastFetch < 10000) {
            console.log(`Skipping background refresh for Imgur URL to avoid rate limits: ${fullUrl}`);
            return;
          }
        }
        
        // Update last fetch time
        fs.writeFileSync(imgurLastFetchFile, Date.now().toString());
      } catch (throttleError) {
        console.error('Error with Imgur throttling:', throttleError);
        // Continue anyway but with additional delay
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    try {
      console.log(`Background refreshing image: ${fullUrl}`);
      const { buffer, contentType } = await fetchImage(fullUrl);
      const ext = extensionForContentType(contentType);

      try {
        fs.writeFileSync(path.join(UPLOADS_DIR, `${fileHash}${ext}`), buffer);
        console.log(`Successfully refreshed image: ${fullUrl}`);

        // If this was previously rate limited, cleanup the rate limited placeholder
        if (fs.existsSync(rateLimitedMarker)) {
          fs.unlinkSync(rateLimitedMarker);
          console.log(`Removed rate-limited placeholder after successful refresh: ${fullUrl}`);
        }
      } catch (writeError: any) {
        console.error('Error writing refreshed image to disk:', writeError);
      }
    } catch (fetchError: any) {
      const status = fetchError instanceof ImageFetchError ? fetchError.status : undefined;

      // Handle rate limiting specially
      if (status === 429) {
        console.error(`Rate limited when background refreshing image: ${fullUrl}`);

        // Create rate limited placeholder if this is an Imgur URL
        if (fullUrl.includes('imgur.com')) {
          writeRateLimitedPlaceholder(fileHash, buildRateLimitedSvg(fullUrl));
          console.log(`Created rate-limited placeholder for: ${fullUrl}`);
        }

        return;
      }

      console.error(`Error fetching image: ${fullUrl}`, fetchError?.message || fetchError);
    }
  } catch (error: any) {
    // Just log the error, don't interrupt the request flow
    console.error('Error refreshing image in background:', error);
  }
}