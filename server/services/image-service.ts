import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configuration for rate limiting
const RATE_LIMIT_CONFIG = {
  imgurRequestsPerMinute: 40, // Very conservative limit to avoid rate limiting
  imgurRequestDelay: 2500, // Delay between consecutive requests in ms
  urlBatchSize: 5, // Smaller batches to reduce risk of rate limiting
  batchDelayMs: 30000, // Longer delay between batches in ms
  rateLimitBackoffFactor: 2, // When rate limited, multiply delay by this factor
  maxBatchDelayMs: 120000, // Maximum delay between batches (2 minutes)
  currentBatchDelayMs: 30000, // Current delay, which can be adjusted dynamically
};

// Keep track of ongoing requests to avoid duplication
const ongoingRequests = new Map<string, Promise<any>>();

// Track Imgur API request timing
const imgurRequestTimestamps: number[] = [];

// Helper function to check if a URL is from Imgur
function isImgurUrl(url: string): boolean {
  return url.includes('imgur.com');
}

interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  thumbnails?: {
    small?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
    full?: { url: string; width: number; height: number };
  };
}

export class ImageService {
  /**
   * Get the best URL from an Airtable attachment
   * - For images, prefer the large thumbnail URL
   * - Fall back to the full URL if no thumbnails
   */
  static getBestAttachmentUrl(attachment: AirtableAttachment | string): string {
    if (typeof attachment === 'string') {
      return attachment;
    }

    // If it has thumbnails and it's an image, use the large thumbnail
    if (attachment.thumbnails && attachment.type.startsWith('image/')) {
      if (attachment.thumbnails.large) {
        return attachment.thumbnails.large.url;
      } else if (attachment.thumbnails.small) {
        return attachment.thumbnails.small.url;
      }
    }

    // Otherwise use the full URL
    return attachment.url;
  }

  /**
   * Get image URL through proxy to handle Airtable's expiring URLs
   * Format: /api/images/:encodedUrl
   */
  static getProxyUrl(url: string): string {
    // If it's already a proxy URL, return it as is
    if (url.startsWith('/api/images/')) {
      return url;
    }
    
    // Encode the URL to use as the ID in our proxy
    return `/api/images/${encodeURIComponent(url)}`;
  }

  /**
   * Extract attachment data from Airtable record field
   * Handles both single attachments and arrays of attachments
   */
  static extractAttachmentFromField(field: any): AirtableAttachment | null {
    if (!field) {
      console.log('Empty field received in extractAttachmentFromField');
      return null;
    }

    console.log('Field data type:', typeof field);
    
    // If it's an array, get the first item
    if (Array.isArray(field)) {
      if (field.length === 0) {
        console.log('Empty array received in extractAttachmentFromField');
        return null;
      }
      
      console.log('Array field in extractAttachmentFromField, first item:', field[0]);
      return field[0];
    }
    
    // If it's already an attachment object
    if (typeof field === 'object' && field.url) {
      console.log('Object with URL found in extractAttachmentFromField:', field.url);
      return field;
    }
    
    // If it's a string (potentially an Airtable record ID)
    if (typeof field === 'string') {
      console.log(`String value received in extractAttachmentFromField: "${field}"`);
      // In this case, we can't extract an attachment directly, but we log for debugging
    }
    
    console.log('No valid attachment data found in field:', field);
    return null;
  }

  /**
   * Check if we should throttle Imgur requests based on recent activity
   * This helps avoid hitting rate limits by spacing out requests
   */
  private static shouldThrottleImgurRequest(): boolean {
    const now = Date.now();
    
    // Clean up old timestamps (older than 1 minute)
    const oneMinuteAgo = now - 60000;
    while (imgurRequestTimestamps.length > 0 && 
           imgurRequestTimestamps[0] < oneMinuteAgo) {
      imgurRequestTimestamps.shift();
    }
    
    // Check if we're over the limit
    return imgurRequestTimestamps.length >= RATE_LIMIT_CONFIG.imgurRequestsPerMinute;
  }
  
  /**
   * Add a delay if this is an Imgur URL to respect rate limits
   */
  private static async applyRateLimitDelay(url: string): Promise<void> {
    if (!isImgurUrl(url)) return;
    
    // If we're over the limit, wait until we're under it
    while (this.shouldThrottleImgurRequest()) {
      console.log(`Rate limiting Imgur request for ${url}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Add a delay between consecutive Imgur requests
    if (isImgurUrl(url) && imgurRequestTimestamps.length > 0) {
      const lastRequestTime = imgurRequestTimestamps[imgurRequestTimestamps.length - 1];
      const timeSinceLastRequest = Date.now() - lastRequestTime;
      
      if (timeSinceLastRequest < RATE_LIMIT_CONFIG.imgurRequestDelay) {
        const delayNeeded = RATE_LIMIT_CONFIG.imgurRequestDelay - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, delayNeeded));
      }
    }
    
    // Record this request
    imgurRequestTimestamps.push(Date.now());
  }

  /**
   * Fetch an image from a URL and cache it locally with rate limiting
   */
  static async fetchAndCacheImage(url: string, id: string): Promise<string> {
    // Generate a filename based on ID
    const fileHash = crypto.createHash('md5').update(id).digest('hex');
    const ext = path.extname(url) || '.jpg';
    const filename = `${fileHash}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Check if we already have this file cached
    if (fs.existsSync(filepath)) {
      return filepath;
    }
    
    // Check if there's already an ongoing request for this URL
    const requestKey = `fetch-${url}`;
    if (ongoingRequests.has(requestKey)) {
      try {
        await ongoingRequests.get(requestKey);
        // If the file exists after the request completes, return it
        if (fs.existsSync(filepath)) {
          return filepath;
        }
      } catch (error) {
        // The previous request failed, we'll try again
      }
    }

    // Create a new request promise
    const requestPromise = (async () => {
      try {
        // Apply rate limiting if it's an Imgur URL
        await this.applyRateLimitDelay(url);
        
        // Fetch the image
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 429) {
            // Increase delay for future batches when rate limited
            RATE_LIMIT_CONFIG.currentBatchDelayMs = Math.min(
              RATE_LIMIT_CONFIG.currentBatchDelayMs * RATE_LIMIT_CONFIG.rateLimitBackoffFactor,
              RATE_LIMIT_CONFIG.maxBatchDelayMs
            );
            console.log(`Rate limited! Increasing batch delay to ${RATE_LIMIT_CONFIG.currentBatchDelayMs/1000}s`);
            throw new Error(`Rate limited (429) when fetching image: ${url}`);
          }
          throw new Error(`Failed to fetch image: ${url} (Status: ${response.status})`);
        }

        // Save to disk
        const buffer = await response.buffer();
        fs.writeFileSync(filepath, buffer);
        
        // If we got here, we successfully fetched an image, so we can gradually reduce our backoff
        if (RATE_LIMIT_CONFIG.currentBatchDelayMs > RATE_LIMIT_CONFIG.batchDelayMs) {
          RATE_LIMIT_CONFIG.currentBatchDelayMs = Math.max(
            RATE_LIMIT_CONFIG.currentBatchDelayMs / 1.5, // Gradually reduce
            RATE_LIMIT_CONFIG.batchDelayMs // Don't go below base delay
          );
          console.log(`Successfully fetched image, reducing batch delay to ${RATE_LIMIT_CONFIG.currentBatchDelayMs/1000}s`);
        }
        
        return filepath;
      } catch (error) {
        console.error(`Error fetching image from ${url}:`, error);
        throw error;
      } finally {
        // Remove from ongoing requests
        ongoingRequests.delete(requestKey);
      }
    })();

    // Store the promise
    ongoingRequests.set(requestKey, requestPromise);
    
    return await requestPromise;
  }
  
  /**
   * Preload and cache a batch of images
   * This helps avoid rate limiting by spreading out requests
   */
  static async preloadImageBatch(urls: string[]): Promise<void> {
    console.log(`Preloading batch of ${urls.length} images`);
    
    // Process URLs in smaller batches to avoid overwhelming the server
    const batches = [];
    for (let i = 0; i < urls.length; i += RATE_LIMIT_CONFIG.urlBatchSize) {
      batches.push(urls.slice(i, i + RATE_LIMIT_CONFIG.urlBatchSize));
    }
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i+1}/${batches.length} (${batch.length} URLs)`);
      
      // Process each URL in the batch with rate limiting
      await Promise.allSettled(
        batch.map(async (url) => {
          try {
            // Make sure we're using the actual direct URL, not our API endpoint
            let directUrl = url;
            
            // If this is our proxy URL, extract the original URL
            if (url.startsWith('/api/images/')) {
              try {
                directUrl = decodeURIComponent(url.substring('/api/images/'.length));
                console.log(`Extracted direct URL from proxy: ${directUrl}`);
              } catch (decodeError) {
                console.error(`Failed to decode proxy URL ${url}:`, decodeError);
                return; // Skip this URL
              }
            }
            
            // Skip URLs that don't seem to be valid
            if (!directUrl.startsWith('http')) {
              console.log(`Skipping invalid URL: ${directUrl}`);
              return;
            }
            
            const fileHash = crypto.createHash('md5').update(directUrl).digest('hex');
            await this.fetchAndCacheImage(directUrl, directUrl);
          } catch (error) {
            console.error(`Failed to preload ${url}:`, error);
            // Continue with other URLs
          }
        })
      );
      
      // Add delay between batches
      if (i < batches.length - 1) {
        // Use the current delay, which may have been increased due to rate limiting
        console.log(`Waiting ${RATE_LIMIT_CONFIG.currentBatchDelayMs/1000}s before next batch`);
        await new Promise(resolve => 
          setTimeout(resolve, RATE_LIMIT_CONFIG.currentBatchDelayMs)
        );
      }
    }
    
    console.log(`Preloaded ${urls.length} images`);
  }
}