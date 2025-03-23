/**
 * Direct Airtable Image Caching Script
 * 
 * This script directly connects to the Airtable API to fetch
 * all image attachments and cache them locally. It bypasses
 * our regular API to get the raw Airtable data.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Airtable from 'airtable';

// Configure Airtable
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Ensure required environment variables are set
if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Error: AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables must be set');
  process.exit(1);
}

// Configure Airtable
Airtable.configure({
  apiKey: AIRTABLE_API_KEY
});

const base = Airtable.base(AIRTABLE_BASE_ID);

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Function to extract attachment URLs from a record
function extractAttachmentUrls(record) {
  const urls = [];
  
  // Debug log each record ID for tracing
  console.log(`Processing record: ${record.id}`);
  
  // Process all fields in the record
  for (const fieldName in record.fields) {
    const field = record.fields[fieldName];
    
    // Check if field is an array (potentially attachments)
    if (Array.isArray(field)) {
      field.forEach((item, index) => {
        // If item has a URL property, it's likely an attachment
        if (item && typeof item === 'object' && item.url) {
          console.log(`Found attachment in field "${fieldName}" [${index}]: ${item.url.substring(0, 80)}...`);
          urls.push(item.url);
          
          // If there are thumbnails, add them too
          if (item.thumbnails) {
            if (item.thumbnails.large && item.thumbnails.large.url) {
              console.log(`Found large thumbnail: ${item.thumbnails.large.url.substring(0, 80)}...`);
              urls.push(item.thumbnails.large.url);
            }
            if (item.thumbnails.small && item.thumbnails.small.url) {
              console.log(`Found small thumbnail: ${item.thumbnails.small.url.substring(0, 80)}...`);
              urls.push(item.thumbnails.small.url);
            }
            if (item.thumbnails.full && item.thumbnails.full.url) {
              console.log(`Found full thumbnail: ${item.thumbnails.full.url.substring(0, 80)}...`);
              urls.push(item.thumbnails.full.url);
            }
          }
        } else if (typeof item === 'string' && item.startsWith('http') && 
                  (item.includes('.jpg') || item.includes('.jpeg') || 
                   item.includes('.png') || item.includes('.gif') || 
                   item.includes('.webp') || item.includes('.svg'))) {
          // It's a direct URL to an image
          console.log(`Found image URL in field "${fieldName}" [${index}]: ${item.substring(0, 80)}...`);
          urls.push(item);
        }
      });
    }
    // Check if field is a direct URL string
    else if (typeof field === 'string' && field.startsWith('http') && 
            (field.includes('.jpg') || field.includes('.jpeg') || 
             field.includes('.png') || field.includes('.gif') || 
             field.includes('.webp') || field.includes('.svg'))) {
      console.log(`Found image URL in field "${fieldName}": ${field.substring(0, 80)}...`);
      urls.push(field);
    }
    // Check if this is a rich text field that might contain image URLs
    else if (typeof field === 'string' && 
            (fieldName.includes('content') || fieldName.includes('description') || 
             fieldName.includes('text') || fieldName.includes('html') || 
             fieldName.includes('body') || fieldName.includes('bio'))) {
      // Find all image URLs in HTML/text content
      const imgRegex = /(https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
      const matches = field.match(imgRegex);
      
      if (matches && matches.length > 0) {
        console.log(`Found ${matches.length} image URLs in rich text field "${fieldName}"`);
        matches.forEach(url => urls.push(url));
      }
    }
    // Check if this is an object with a URL property
    else if (field && typeof field === 'object' && field.url && typeof field.url === 'string') {
      console.log(`Found object with URL in field "${fieldName}": ${field.url.substring(0, 80)}...`);
      urls.push(field.url);
      
      // Check for thumbnails in the same pattern
      if (field.thumbnails) {
        if (field.thumbnails.large && field.thumbnails.large.url) {
          urls.push(field.thumbnails.large.url);
        }
        if (field.thumbnails.small && field.thumbnails.small.url) {
          urls.push(field.thumbnails.small.url);
        }
        if (field.thumbnails.full && field.thumbnails.full.url) {
          urls.push(field.thumbnails.full.url);
        }
      }
    }
  }
  
  return urls;
}

// Function to cache a single image
async function cacheImage(imageUrl) {
  try {
    console.log(`Caching image: ${imageUrl.substring(0, 100)}...`);
    
    // Generate a consistent filename from the URL
    const fileHash = crypto.createHash('md5').update(imageUrl).digest('hex');
    
    // Look for cached version first
    const cachedFiles = fs.readdirSync(UPLOADS_DIR).filter(f => f.startsWith(fileHash));
    if (cachedFiles.length > 0) {
      console.log(`Image already cached as: ${cachedFiles[0]}`);
      return;
    }
    
    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return;
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
      return;
    }
    
    console.log(`Received image: ${buffer.length} bytes`);
    
    // Save the image to disk
    const filepath = path.join(UPLOADS_DIR, `${fileHash}${ext}`);
    fs.writeFileSync(filepath, buffer);
    console.log(`Saved image to: ${filepath}`);
    
  } catch (error) {
    console.error(`Error caching image: ${error.message}`);
  }
}

// Main function to fetch all data from Airtable tables
async function cacheAllAirtableImages() {
  const allImageUrls = new Set();
  
  try {
    console.log('Starting direct Airtable image caching process...');
    
    // Get a list of all tables in the base
    console.log('Fetching list of tables from Airtable base...');
    let tables = [];
    
    try {
      // Make a direct API request to list tables
      const response = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`, {
        headers: { 
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        tables = data.tables.map(table => table.name);
        console.log(`Found ${tables.length} tables in Airtable base: ${tables.join(', ')}`);
      } else {
        console.error(`Failed to fetch tables: ${response.status} ${response.statusText}`);
        // Fall back to default tables
        tables = ['Team', 'Articles', 'Teams', 'Blog', 'Content', 'Images', 'Authors', 'Members'];
        console.log(`Using fallback table list: ${tables.join(', ')}`);
      }
    } catch (error) {
      console.error(`Error fetching tables: ${error.message}`);
      // Fall back to default tables
      tables = ['Team', 'Articles', 'Teams', 'Blog', 'Content', 'Images', 'Authors', 'Members'];
      console.log(`Using fallback table list: ${tables.join(', ')}`);
    }
    
    for (const table of tables) {
      console.log(`Fetching records from "${table}" table...`);
      
      try {
        // Get all records from this table
        const records = await base(table).select().all();
        console.log(`Found ${records.length} records in "${table}" table`);
        
        // Extract attachment URLs from each record
        records.forEach(record => {
          const urls = extractAttachmentUrls(record);
          urls.forEach(url => allImageUrls.add(url));
        });
      } catch (error) {
        console.error(`Error fetching records from "${table}" table: ${error.message}`);
        // Continue with other tables even if one fails
      }
    }
    
    console.log(`Found ${allImageUrls.size} unique image URLs to cache`);
    
    if (allImageUrls.size === 0) {
      console.log('No image URLs found to cache. This could mean:');
      console.log('1. There are no images in the Airtable');
      console.log('2. The Airtable API key or Base ID might be incorrect');
      console.log('3. The table names "Team" and "Articles" might not match your Airtable');
      return;
    }
    
    // Cache each image
    for (const url of allImageUrls) {
      await cacheImage(url);
    }
    
    console.log('Image caching completed successfully!');
  } catch (error) {
    console.error('Error during image caching:', error);
  }
}

// Run the script
cacheAllAirtableImages();