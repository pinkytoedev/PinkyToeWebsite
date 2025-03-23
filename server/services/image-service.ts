import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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
    if (!field) return null;

    // If it's an array, get the first item
    if (Array.isArray(field) && field.length > 0) {
      return field[0];
    }
    
    // If it's already an attachment object
    if (typeof field === 'object' && field.url) {
      return field;
    }
    
    return null;
  }

  /**
   * Fetch an image from a URL and cache it locally
   * @param {string} url - The URL of the image to fetch
   * @param {string} id - Unique identifier for this image (usually record ID or URL hash)
   * @param {string} [recordId] - Optional record ID to associate with this image
   * @param {string} [recordType] - Optional record type (e.g., 'article', 'team')
   * @returns {Promise<string>} The local file path
   */
  static async fetchAndCacheImage(
    url: string, 
    id: string, 
    recordId?: string, 
    recordType?: string
  ): Promise<string> {
    // Generate a filename based on ID
    const fileHash = crypto.createHash('md5').update(id).digest('hex');
    const contentType = await ImageService.getContentType(url) || 'image/jpeg';
    const ext = contentType.includes('png') ? '.png' : 
                contentType.includes('gif') ? '.gif' : 
                contentType.includes('webp') ? '.webp' : '.jpg';
    const filename = `${fileHash}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Check if we already have this file cached
    if (fs.existsSync(filepath)) {
      // Still update our mappings
      ImageService.updateImageMappings(url, filename, recordId, recordType);
      return filepath;
    }

    try {
      // Fetch the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      // Save to disk
      const buffer = await response.buffer();
      fs.writeFileSync(filepath, buffer);
      
      // Update our mappings
      ImageService.updateImageMappings(url, filename, recordId, recordType);

      return filepath;
    } catch (error) {
      console.error('Error fetching and caching image:', error);
      throw error;
    }
  }
  
  /**
   * Get the content type of an image from its URL via a HEAD request
   */
  static async getContentType(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        return null;
      }
      return response.headers.get('content-type');
    } catch (error) {
      console.error('Error getting content type:', error);
      return null;
    }
  }
  
  /**
   * Update our URL-to-filename and image-record mappings
   */
  static updateImageMappings(
    url: string, 
    filename: string, 
    recordId?: string, 
    recordType?: string
  ): void {
    try {
      // Update URL-to-filename mapping
      const urlMapPath = path.join(process.cwd(), 'url-to-filename-map.json');
      let urlMap: Record<string, string> = {};
      
      if (fs.existsSync(urlMapPath)) {
        try {
          urlMap = JSON.parse(fs.readFileSync(urlMapPath, 'utf8'));
        } catch (e) {
          console.error('Error parsing URL map file:', e);
        }
      }
      
      urlMap[url] = filename;
      fs.writeFileSync(urlMapPath, JSON.stringify(urlMap, null, 2));
      
      // Update image-record mapping if record ID is provided
      if (recordId) {
        const imageRecordMapPath = path.join(process.cwd(), 'image-record-map.json');
        let imageRecordMap: Record<string, any> = {};
        
        if (fs.existsSync(imageRecordMapPath)) {
          try {
            imageRecordMap = JSON.parse(fs.readFileSync(imageRecordMapPath, 'utf8'));
          } catch (e) {
            console.error('Error parsing image record map file:', e);
          }
        }
        
        imageRecordMap[filename] = {
          recordId,
          recordType: recordType || 'unknown',
          url,
          cached: new Date().toISOString()
        };
        
        fs.writeFileSync(imageRecordMapPath, JSON.stringify(imageRecordMap, null, 2));
      }
    } catch (error) {
      console.error('Error updating image mappings:', error);
      // Don't throw, this is a non-critical operation
    }
  }
}