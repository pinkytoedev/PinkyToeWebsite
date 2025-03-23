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

    console.log('Extracting attachment from field:', typeof field, 
      Array.isArray(field) ? `Array[${field.length}]` : 
      typeof field === 'object' ? 'Object' : 
      typeof field === 'string' ? `String: ${field.substring(0, 30)}...` : 
      String(field));
    
    // If it's an array, get the first item
    if (Array.isArray(field) && field.length > 0) {
      console.log('Field is an array, first item type:', typeof field[0]);
      return field[0];
    }
    
    // If it's already an attachment object
    if (typeof field === 'object' && field !== null) {
      // Log object keys to help debug
      console.log('Field is an object with keys:', Object.keys(field));
      
      if ('url' in field) {
        console.log('Field has URL property:', field.url);
        return field as AirtableAttachment;
      }
      
      // Try to detect more complex objects that might have nested attachment
      if ('fields' in field && typeof field.fields === 'object') {
        console.log('Field has fields property, checking for image fields');
        const fields = field.fields;
        
        // Look for common image field names
        for (const key of ['image', 'photo', 'attachment', 'file']) {
          if (key in fields && fields[key]) {
            console.log(`Found ${key} in fields, type:`, typeof fields[key]);
            return this.extractAttachmentFromField(fields[key]);
          }
        }
      }
    }
    
    // Try parsing if it's a string that might be a JSON object
    if (typeof field === 'string' && 
        (field.startsWith('{') || field.includes('url') || field.includes('thumbnail'))) {
      try {
        console.log('Attempting to parse string as JSON');
        const parsed = JSON.parse(field);
        if (parsed && typeof parsed === 'object') {
          return this.extractAttachmentFromField(parsed);
        }
      } catch (err) {
        console.log('Failed to parse string as JSON');
      }
    }
    
    return null;
  }

  /**
   * Fetch an image from a URL and cache it locally
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

    try {
      // Fetch the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      // Save to disk
      const buffer = await response.buffer();
      fs.writeFileSync(filepath, buffer);

      return filepath;
    } catch (error) {
      console.error('Error fetching and caching image:', error);
      throw error;
    }
  }
}