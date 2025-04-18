// Script to check available fields in Airtable records
import * as dotenv from 'dotenv';
import Airtable from 'airtable';

dotenv.config();

// Initialize Airtable
const airtableApiKey = process.env.AIRTABLE_API_KEY || "";
const airtableBaseId = process.env.AIRTABLE_BASE_ID || "";

if (!airtableApiKey || !airtableBaseId) {
  console.error('Missing Airtable credentials. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.');
  process.exit(1);
}

Airtable.configure({
  apiKey: airtableApiKey,
});

const base = Airtable.base(airtableBaseId);

async function checkArticleFields() {
  console.log('Checking article fields in Airtable...');
  
  try {
    // Fetch a few records
    const query = base('History').select({
      maxRecords: 5
    });
    
    const records = await query.all();
    
    if (records.length === 0) {
      console.log('No records found in the History table.');
      return;
    }
    
    // Log fields for each record
    records.forEach((record, index) => {
      console.log(`\nArticle Record ${index + 1} (ID: ${record.id}):`);
      console.log('Available fields:', Object.keys(record.fields));
      
      // Check for MainImageLink field
      if (record.get('MainImageLink')) {
        console.log('MainImageLink field found:', record.get('MainImageLink'));
      } else {
        console.log('MainImageLink field not found');
      }
      
      // Check for MainImage field
      if (record.get('MainImage')) {
        console.log('MainImage field found:', record.get('MainImage'));
      } else {
        console.log('MainImage field not found');
      }
      
      // Check for other image-related fields
      const imageFields = ['imageUrl', 'Image URL', 'Image', 'image', 'Banner', 'banner'];
      imageFields.forEach(field => {
        if (record.get(field)) {
          console.log(`${field} field found:`, record.get(field));
        }
      });
    });
  } catch (error) {
    console.error('Error fetching article records:', error);
  }
}

// Run the check
checkArticleFields();