const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const fetch = require('node-fetch');
const Airtable = require('airtable');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

dotenv.config();

// Configure Airtable
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const ARTICLES_TABLE_NAME = 'Articles';
const TEMP_DIR = path.join(__dirname, 'temp_images');

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Missing Airtable credentials. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// Create temporary directory for downloaded images
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Extracts image ID from Imgur URL
 */
function extractImgurId(url) {
  const imgurRegex = /imgur\.com\/(?:a\/)?([a-zA-Z0-9]+)(?:\.[a-zA-Z0-9]+)?$/;
  const match = url.match(imgurRegex);
  return match ? match[1] : null;
}

/**
 * Downloads an image from a URL to a local file
 */
async function downloadImage(url, outputPath) {
  console.log(`Downloading image from ${url}...`);
  
  // Handle HTTP(S) URLs
  if (url.startsWith('http')) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const fileStream = fs.createWriteStream(outputPath);
    await pipeline(response.body, fileStream);
    console.log(`Image downloaded to ${outputPath}`);
    return;
  }
  
  throw new Error(`Unsupported URL format: ${url}`);
}

/**
 * Uploads an image to PostImages.org using Puppeteer
 */
async function uploadToPostImages(imagePath) {
  console.log(`Uploading ${imagePath} to PostImages.org...`);
  
  // Launch a headless browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to PostImages.org
    await page.goto('https://postimages.org/web', { waitUntil: 'networkidle2' });
    
    // Find the file input field and upload the image
    const fileInputSelector = 'input[type="file"]';
    await page.waitForSelector(fileInputSelector);
    
    // Set the file to upload
    const inputElement = await page.$(fileInputSelector);
    await inputElement.uploadFile(imagePath);
    
    // Wait for upload to complete (wait for the URL input to appear which contains the direct link)
    await page.waitForSelector('input[id="code_direct"]', { timeout: 60000 });
    
    // Get the direct link
    const directLink = await page.$eval('input[id="code_direct"]', (el) => el.value);
    
    // Get the gallery link (which is what we want to store in Airtable, as it's what our server handles)
    const galleryLink = await page.$eval('input[id="code_web"]', (el) => el.value);
    
    console.log(`Upload successful. Gallery link: ${galleryLink}, Direct link: ${directLink}`);
    
    return galleryLink;
  } finally {
    // Close the browser when done
    await browser.close();
  }
}

/**
 * Processes a single article record with Imgur images
 */
async function processArticleRecord(record) {
  const recordId = record.id;
  const mainImageLink = record.get('MainImageLink');
  
  if (!mainImageLink) {
    console.log(`Record ${recordId} has no MainImageLink, skipping.`);
    return;
  }
  
  // Check if the URL is from imgur.com
  if (!mainImageLink.includes('imgur.com')) {
    console.log(`Record ${recordId} has non-Imgur URL: ${mainImageLink}, skipping.`);
    return;
  }
  
  // Check if it's already a postimages.org URL
  if (mainImageLink.includes('postimg.cc') || mainImageLink.includes('postimages.org')) {
    console.log(`Record ${recordId} already has a PostImages URL: ${mainImageLink}, skipping.`);
    return;
  }
  
  try {
    // Extract the image ID from the URL
    const imgurId = extractImgurId(mainImageLink);
    if (!imgurId) {
      console.error(`Could not extract Imgur ID from URL: ${mainImageLink}`);
      return;
    }
    
    // Download the image to a temporary file
    const imgurUrl = `https://i.imgur.com/${imgurId}.jpg`;
    const tempFilePath = path.join(TEMP_DIR, `${imgurId}.jpg`);
    await downloadImage(imgurUrl, tempFilePath);
    
    // Upload the image to PostImages
    const postImagesUrl = await uploadToPostImages(tempFilePath);
    
    // Update the Airtable record with the new URL
    await base(ARTICLES_TABLE_NAME).update(recordId, {
      'MainImageLink': postImagesUrl
    });
    
    console.log(`Updated record ${recordId}: ${mainImageLink} -> ${postImagesUrl}`);
    
    // Remove the temporary file
    fs.unlinkSync(tempFilePath);
    
    // Wait a moment to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error(`Error processing record ${recordId}:`, error);
  }
}

/**
 * Main function to migrate images
 */
async function migrateImgurToPostImages() {
  console.log('Starting Imgur to PostImages migration...');
  
  try {
    // Get all records with an Imgur URL in MainImageLink
    const records = await base(ARTICLES_TABLE_NAME)
      .select({
        filterByFormula: "AND(NOT(SEARCH('imgur.com', {MainImageLink}) = 0), NOT(SEARCH('postimg.cc', {MainImageLink}) > 0))",
        fields: ['MainImageLink', 'Name']
      })
      .all();
    
    console.log(`Found ${records.length} records with Imgur links to migrate.`);
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      console.log(`Processing record ${i + 1} of ${records.length}...`);
      const record = records[i];
      const title = record.get('Name') || 'Untitled';
      const mainImageLink = record.get('MainImageLink');
      
      console.log(`Article: "${title}", Current image: ${mainImageLink}`);
      await processArticleRecord(record);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Clean up temp directory
    if (fs.existsSync(TEMP_DIR)) {
      fs.readdirSync(TEMP_DIR).forEach(file => {
        fs.unlinkSync(path.join(TEMP_DIR, file));
      });
      fs.rmdirSync(TEMP_DIR);
    }
  }
}

// Run the migration
migrateImgurToPostImages().catch(console.error);