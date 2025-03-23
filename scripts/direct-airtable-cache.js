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

// Configure Airtable with more lenient timeout and retry options
Airtable.configure({
  apiKey: AIRTABLE_API_KEY,
  requestTimeout: 300000, // 5 minutes
  endpointUrl: 'https://api.airtable.com',
});

const base = Airtable.base(AIRTABLE_BASE_ID);

// Define the standard Airtable tables we know exist in the project
const KNOWN_TABLES = [
  'Team',         // Team members
  'Articles',     // Blog articles 
  'First',        // Might be main content
  'CarouselQuote', // Quotes/testimonials
  'History',      // Historical content
  'Blog',         // Alternative blog table
  'Content',      // General content
  'Images',       // Dedicated image table
  'Members',      // Alternative team members
  'Authors'       // Article authors
];

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

  // Common image field patterns
  const imageFieldPatterns = [
    'image', 'photo', 'picture', 'avatar', 'icon', 'logo', 'banner',
    'thumbnail', 'cover', 'header', 'background', 'featured'
  ];
  
  // Process all fields in the record
  for (const fieldName in record.fields) {
    const field = record.fields[fieldName];
    const fieldNameLower = fieldName.toLowerCase();
    
    const isLikelyImageField = imageFieldPatterns.some(pattern => 
      fieldNameLower.includes(pattern) || fieldNameLower === pattern
    );
    
    if (isLikelyImageField) {
      console.log(`Found potential image field: "${fieldName}"`);
    }
    
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
        } else if (typeof item === 'string' && item.startsWith('http')) {
          // Check if it's an image URL by common extensions or URL patterns
          if (item.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i) ||
              item.includes('images') || item.includes('photos') || 
              item.includes('thumbnails') || item.includes('media')) {
            console.log(`Found image URL in field "${fieldName}" [${index}]: ${item.substring(0, 80)}...`);
            urls.push(item);
          }
        }
      });
    }
    // Check if field is a direct URL string
    else if (typeof field === 'string' && field.startsWith('http')) {
      // Check if it's an image URL by common extensions or URL patterns
      if (field.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i) ||
          field.includes('images') || field.includes('photos') || 
          field.includes('thumbnails') || field.includes('media')) {
        console.log(`Found image URL in field "${fieldName}": ${field.substring(0, 80)}...`);
        urls.push(field);
      }
    }
    // Check if this is a rich text field that might contain image URLs
    else if (typeof field === 'string' && (
      fieldNameLower.includes('content') || 
      fieldNameLower.includes('description') || 
      fieldNameLower.includes('text') || 
      fieldNameLower.includes('html') || 
      fieldNameLower.includes('body') || 
      fieldNameLower.includes('bio') ||
      fieldNameLower.includes('about') ||
      fieldNameLower.includes('detail') ||
      field.includes('<img') || // Contains HTML img tags
      field.includes('src=') // Contains src attributes
    )) {
      // Find all image URLs in HTML content (img tags)
      const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      let match;
      const imgUrls = [];
      
      while ((match = imgTagRegex.exec(field)) !== null) {
        if (match[1] && match[1].startsWith('http')) {
          imgUrls.push(match[1]);
        }
      }
      
      // Find all direct image URLs by extension
      const imgUrlRegex = /(https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|gif|webp|svg)($|\?))/gi;
      const directMatches = field.match(imgUrlRegex) || [];
      
      // Find URLs containing image-like paths
      const imgPathRegex = /(https?:\/\/[^\s"'<>]+\/(images|photos|media|uploads)\/[^\s"'<>]+)/gi;
      const pathMatches = field.match(imgPathRegex) || [];
      
      // Combine all matches
      const allMatches = [...imgUrls, ...directMatches, ...pathMatches];
      const uniqueMatches = [...new Set(allMatches)]; // Remove duplicates
      
      if (uniqueMatches.length > 0) {
        console.log(`Found ${uniqueMatches.length} image URLs in rich text field "${fieldName}"`);
        uniqueMatches.forEach(url => urls.push(url));
      }
    }
    // Check if this is an object with a URL property
    else if (field && typeof field === 'object') {
      // Handle URL property
      if (field.url && typeof field.url === 'string') {
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
      
      // Check for other possible image-related keys in the object
      const possibleImageKeys = ['image', 'imageUrl', 'photo', 'picture', 'thumbnail', 'src'];
      for (const key of possibleImageKeys) {
        if (field[key] && typeof field[key] === 'string' && field[key].startsWith('http')) {
          console.log(`Found image URL in nested object field "${fieldName}.${key}": ${field[key].substring(0, 80)}...`);
          urls.push(field[key]);
        }
      }
    }
  }
  
  // Look for raw data object fields with a different pattern
  for (const fieldName in record._rawJson?.fields) {
    const field = record._rawJson?.fields[fieldName];
    
    // Sometimes Airtable API returns _rawJson with different data format
    if (field && Array.isArray(field) && field.length > 0) {
      field.forEach(item => {
        // Check for URLs in raw data that might have been missed
        if (typeof item === 'object' && item.url && typeof item.url === 'string') {
          console.log(`Found URL in _rawJson for field "${fieldName}": ${item.url.substring(0, 80)}...`);
          urls.push(item.url);
          
          // Check for thumbnails
          if (item.thumbnails) {
            Object.values(item.thumbnails).forEach(thumb => {
              if (thumb && thumb.url) {
                urls.push(thumb.url);
              }
            });
          }
        }
      });
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

// Create a mapping between record IDs and their images for reference
const recordImageMap = new Map();

// Process image fields for Articles specifically
function processArticleRecord(record) {
  const urls = [];
  const id = record.id;
  
  // Store the mapping
  recordImageMap.set(id, { 
    id,
    title: record.fields.title || record.fields.name || 'Untitled',
    images: []
  });
  
  // Common image field names in articles
  const imageFieldNames = [
    'image', 'imageUrl', 'mainImage', 'mainPhoto', 'photo', 'thumbnail',
    'featured_image', 'headerImage', 'coverImage', 'featureImage'
  ];
  
  // Try to find the main image for this article
  let mainImageFound = false;
  for (const fieldName of imageFieldNames) {
    if (record.fields[fieldName]) {
      const field = record.fields[fieldName];
      
      // Process array fields
      if (Array.isArray(field) && field.length > 0) {
        field.forEach((item, index) => {
          if (item && typeof item === 'object' && item.url) {
            console.log(`Found article image in field "${fieldName}" [${index}]: ${item.url.substring(0, 80)}...`);
            urls.push(item.url);
            recordImageMap.get(id).images.push({
              url: item.url,
              field: fieldName,
              type: 'main'
            });
            mainImageFound = true;
            
            // Get thumbnails too
            if (item.thumbnails) {
              if (item.thumbnails.large && item.thumbnails.large.url) {
                urls.push(item.thumbnails.large.url);
                recordImageMap.get(id).images.push({
                  url: item.thumbnails.large.url,
                  field: `${fieldName}_large_thumb`,
                  type: 'thumbnail'
                });
              }
              if (item.thumbnails.small && item.thumbnails.small.url) {
                urls.push(item.thumbnails.small.url);
                recordImageMap.get(id).images.push({
                  url: item.thumbnails.small.url,
                  field: `${fieldName}_small_thumb`,
                  type: 'thumbnail'
                });
              }
              if (item.thumbnails.full && item.thumbnails.full.url) {
                urls.push(item.thumbnails.full.url);
                recordImageMap.get(id).images.push({
                  url: item.thumbnails.full.url,
                  field: `${fieldName}_full_thumb`,
                  type: 'thumbnail'
                });
              }
            }
          }
        });
      }
      // Process string fields
      else if (typeof field === 'string' && field.startsWith('http')) {
        console.log(`Found article image URL in field "${fieldName}": ${field.substring(0, 80)}...`);
        urls.push(field);
        recordImageMap.get(id).images.push({
          url: field,
          field: fieldName,
          type: 'main'
        });
        mainImageFound = true;
      }
    }
  }
  
  // Check for images in rich text content
  if (record.fields.content && typeof record.fields.content === 'string') {
    const imgRegex = /(https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
    const matches = record.fields.content.match(imgRegex);
    
    if (matches && matches.length > 0) {
      console.log(`Found ${matches.length} image URLs in article content`);
      matches.forEach((url, index) => {
        urls.push(url);
        recordImageMap.get(id).images.push({
          url: url,
          field: 'content',
          type: 'embedded',
          index
        });
      });
    }
  }
  
  return urls;
}

// Main function to fetch all data from Airtable tables
async function cacheAllAirtableImages() {
  const allImageUrls = new Set();
  
  try {
    console.log('Starting direct Airtable image caching process...');
    
    // First try KNOWN_TABLES, then try to discover tables
    console.log('First checking known tables...');
    const allTables = new Set();
    
    // Add all known tables to our set
    for (const tableName of KNOWN_TABLES) {
      allTables.add(tableName);
    }
    
    // Try to discover more tables
    try {
      console.log('Attempting to discover additional tables...');
      const response = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`, {
        headers: { 
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        data.tables.forEach(table => allTables.add(table.name));
        console.log(`Found ${data.tables.length} tables via API discovery`);
      } else {
        console.error(`Failed to discover tables via API: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error discovering tables: ${error.message}`);
    }
    
    console.log(`Processing ${allTables.size} tables: ${Array.from(allTables).join(', ')}`);
    
    // Process Articles table first to ensure we get article images
    if (allTables.has('Articles')) {
      console.log('Processing Articles table first...');
      try {
        const records = await base('Articles').select().all();
        console.log(`Found ${records.length} records in "Articles" table`);
        
        // Process articles with special handling
        for (const record of records) {
          const urls = processArticleRecord(record);
          urls.forEach(url => allImageUrls.add(url));
        }
      } catch (error) {
        console.error(`Error processing Articles table: ${error.message}`);
      }
      
      // Remove Articles from the set to avoid duplicate processing
      allTables.delete('Articles');
    }
    
    // Process all other tables
    for (const tableName of allTables) {
      console.log(`Processing "${tableName}" table...`);
      
      try {
        const records = await base(tableName).select().all();
        console.log(`Found ${records.length} records in "${tableName}" table`);
        
        // Special handling for some tables
        if (tableName === 'Blog') {
          // Process blog posts with article-specific handling
          for (const record of records) {
            const urls = processArticleRecord(record);
            urls.forEach(url => allImageUrls.add(url));
          }
        } else {
          // Generic processing for other tables
          records.forEach(record => {
            const urls = extractAttachmentUrls(record);
            
            // If we found image URLs, add this record to the mapping
            if (urls.length > 0) {
              const id = record.id;
              
              // Create a record entry if it doesn't exist
              if (!recordImageMap.has(id)) {
                recordImageMap.set(id, {
                  id,
                  table: tableName,
                  title: record.fields.title || record.fields.name || 
                        record.fields.fullName || record.fields.description || 
                        `${tableName} record`,
                  images: []
                });
              }
              
              // Add image URLs to the record's image list
              urls.forEach((url, index) => {
                recordImageMap.get(id).images.push({
                  url,
                  type: 'attachment',
                  index
                });
              });
            }
            
            // Add all found URLs to the allImageUrls set
            urls.forEach(url => allImageUrls.add(url));
          });
        }
      } catch (error) {
        console.error(`Error processing "${tableName}" table: ${error.message}`);
      }
    }
    
    console.log(`Found ${allImageUrls.size} unique image URLs to cache`);
    
    if (allImageUrls.size === 0) {
      console.log('No image URLs found to cache. This could mean:');
      console.log('1. There are no images in the Airtable');
      console.log('2. The Airtable API key or Base ID might be incorrect');
      console.log('3. The table names might not match your Airtable structure');
      return;
    }
    
    // Save the record-image mapping for reference
    try {
      const mapPath = path.join(process.cwd(), 'image-record-map.json');
      // Convert Map to a proper array of objects for serialization
      const recordsArray = Array.from(recordImageMap.values()).filter(
        entry => entry.images && entry.images.length > 0
      );
      
      console.log(`Found ${recordsArray.length} records with images to save in mapping`);
      
      fs.writeFileSync(
        mapPath, 
        JSON.stringify(recordsArray, null, 2)
      );
      console.log(`Saved image-record mapping to ${mapPath}`);
      
      // Also create a URL to filename lookup map
      const urlToFilenameMap = {};
      for (const record of recordsArray) {
        for (const image of record.images) {
          if (image.url) {
            const fileHash = crypto.createHash('md5').update(image.url).digest('hex');
            // Find the matching file extension in the uploads directory
            let extension = '.jpg'; // Default
            try {
              const files = fs.readdirSync(UPLOADS_DIR);
              const matchingFile = files.find(file => file.startsWith(fileHash));
              if (matchingFile) {
                extension = path.extname(matchingFile);
              }
            } catch (err) {
              console.error(`Error checking file extension: ${err.message}`);
            }
            
            urlToFilenameMap[image.url] = `${fileHash}${extension}`;
          }
        }
      }
      
      // Save URL to filename map for client-side usage
      const urlMapPath = path.join(process.cwd(), 'url-to-filename-map.json');
      fs.writeFileSync(
        urlMapPath,
        JSON.stringify(urlToFilenameMap, null, 2)
      );
      console.log(`Saved URL-to-filename mapping to ${urlMapPath}`);
      
    } catch (error) {
      console.error('Error saving image-record mapping:', error.message);
    }
    
    // Cache each image
    let cacheCount = 0;
    for (const url of allImageUrls) {
      await cacheImage(url);
      cacheCount++;
      
      // Log progress every 10 images
      if (cacheCount % 10 === 0) {
        console.log(`Progress: Cached ${cacheCount}/${allImageUrls.size} images`);
      }
    }
    
    console.log('Image caching completed successfully!');
    console.log(`Total images cached: ${cacheCount}`);
  } catch (error) {
    console.error('Error during image caching:', error);
  }
}

// Run the script
cacheAllAirtableImages();