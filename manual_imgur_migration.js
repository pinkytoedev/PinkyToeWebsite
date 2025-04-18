const Airtable = require('airtable');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const fetch = require('node-fetch');
const readline = require('readline');

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

// Create an interface for reading from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptAsync(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
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
    return true;
  }
  
  throw new Error(`Unsupported URL format: ${url}`);
}

/**
 * Main function to migrate images manually
 */
async function manualImgurMigration() {
  console.log('Starting manual Imgur to PostImages migration helper...');
  
  try {
    // Get all records with an Imgur URL in MainImageLink
    const records = await base(ARTICLES_TABLE_NAME)
      .select({
        filterByFormula: "AND(NOT(SEARCH('imgur.com', {MainImageLink}) = 0), NOT(SEARCH('postimg.cc', {MainImageLink}) > 0))",
        fields: ['MainImageLink', 'Name']
      })
      .all();
    
    console.log(`Found ${records.length} records with Imgur links to migrate.`);
    
    // Process each record with manual input
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const recordId = record.id;
      const title = record.get('Name') || 'Untitled';
      const mainImageLink = record.get('MainImageLink');
      
      console.log(`\n[${i + 1}/${records.length}] Article: "${title}"`);
      console.log(`Current Imgur URL: ${mainImageLink}`);
      
      // Extract the Imgur image ID
      const imgurId = extractImgurId(mainImageLink);
      if (!imgurId) {
        console.log(`Could not extract Imgur ID from URL: ${mainImageLink}`);
        console.log('Skipping this record...');
        continue;
      }
      
      // Download the image to a temporary file
      const imgurUrl = `https://i.imgur.com/${imgurId}.jpg`;
      const tempFilePath = path.join(TEMP_DIR, `${imgurId}.jpg`);
      let downloaded = false;
      
      try {
        downloaded = await downloadImage(imgurUrl, tempFilePath);
      } catch (error) {
        console.error(`Failed to download image: ${error.message}`);
        const tryFallback = await promptAsync('Try fallback PNG instead of JPG? (y/n): ');
        if (tryFallback.toLowerCase() === 'y') {
          const fallbackUrl = `https://i.imgur.com/${imgurId}.png`;
          try {
            downloaded = await downloadImage(fallbackUrl, tempFilePath);
          } catch (fallbackError) {
            console.error(`Failed to download fallback image: ${fallbackError.message}`);
          }
        }
      }
      
      if (!downloaded) {
        console.log('Could not download the image. Skipping this record...');
        continue;
      }
      
      console.log('\n1. The image has been downloaded to:', tempFilePath);
      console.log('2. Please manually upload this image to https://postimages.org/web');
      console.log('3. After uploading, copy the "Web link (short url)" from PostImages.');
      
      const postImagesUrl = await promptAsync('\nEnter the PostImages web link (or type "skip" to skip): ');
      
      if (postImagesUrl.toLowerCase() === 'skip') {
        console.log('Skipped updating this record.');
        continue;
      }
      
      if (!postImagesUrl.includes('postimg.cc')) {
        console.log('URL does not look like a valid PostImages URL. Please make sure you copied the right URL.');
        const confirmUpdate = await promptAsync('Update anyway? (y/n): ');
        if (confirmUpdate.toLowerCase() !== 'y') {
          console.log('Skipped updating this record.');
          continue;
        }
      }
      
      // Update the Airtable record with the new URL
      await base(ARTICLES_TABLE_NAME).update(recordId, {
        'MainImageLink': postImagesUrl
      });
      
      console.log(`Updated record ${recordId}: ${mainImageLink} -> ${postImagesUrl}`);
      
      // Remove the temporary file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (error) {
        console.error(`Error removing temporary file: ${error.message}`);
      }
    }
    
    console.log('\nMigration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Clean up temp directory
    if (fs.existsSync(TEMP_DIR)) {
      fs.readdirSync(TEMP_DIR).forEach(file => {
        try {
          fs.unlinkSync(path.join(TEMP_DIR, file));
        } catch (error) {
          console.error(`Error removing file ${file}: ${error.message}`);
        }
      });
      try {
        fs.rmdirSync(TEMP_DIR);
      } catch (error) {
        console.error(`Error removing temp directory: ${error.message}`);
      }
    }
    
    // Close the readline interface
    rl.close();
  }
}

// Run the migration
manualImgurMigration().catch(console.error);