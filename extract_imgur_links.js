const Airtable = require('airtable');
const dotenv = require('dotenv');

dotenv.config();

// Configure Airtable
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const ARTICLES_TABLE_NAME = 'Articles';

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Missing Airtable credentials. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

/**
 * Extracts image ID from Imgur URL
 */
function extractImgurId(url) {
  const imgurRegex = /imgur\.com\/(?:a\/)?([a-zA-Z0-9]+)(?:\.[a-zA-Z0-9]+)?$/;
  const match = url.match(imgurRegex);
  return match ? match[1] : null;
}

/**
 * Main function to extract Imgur links
 */
async function extractImgurLinks() {
  console.log('Extracting Imgur links from Airtable...');
  
  try {
    // Get all records with an Imgur URL in MainImageLink
    const records = await base(ARTICLES_TABLE_NAME)
      .select({
        filterByFormula: "NOT(SEARCH('imgur.com', {MainImageLink}) = 0)",
        fields: ['MainImageLink', 'Name']
      })
      .all();
    
    console.log(`Found ${records.length} records with Imgur links.`);
    
    // Create a CSV-formatted output
    let output = 'Record ID,Article Title,Imgur URL,Imgur ID,Direct Imgur URL\n';
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const recordId = record.id;
      const title = (record.get('Name') || 'Untitled').replace(/,/g, ' '); // Remove commas for CSV
      const mainImageLink = record.get('MainImageLink');
      const imgurId = extractImgurId(mainImageLink);
      const directImgurUrl = imgurId ? `https://i.imgur.com/${imgurId}.jpg` : 'N/A';
      
      output += `${recordId},"${title}",${mainImageLink},${imgurId || 'N/A'},${directImgurUrl}\n`;
      console.log(`Article: "${title}", Image: ${mainImageLink}, Imgur ID: ${imgurId || 'N/A'}`);
    }
    
    // Write to a file
    const fs = require('fs');
    fs.writeFileSync('imgur_links.csv', output);
    
    console.log('Extraction completed successfully! Results saved to imgur_links.csv');
  } catch (error) {
    console.error('Extraction failed:', error);
  }
}

// Run the extraction
extractImgurLinks().catch(console.error);