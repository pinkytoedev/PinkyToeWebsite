
import Airtable from "airtable";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const airtableApiKey = process.env.AIRTABLE_API_KEY || "";
const airtableBaseId = process.env.AIRTABLE_BASE_ID || "";

if (!airtableApiKey || !airtableBaseId) {
  console.error("Error: AIRTABLE_API_KEY or AIRTABLE_BASE_ID environment variables not set");
  process.exit(1);
}

// Initialize Airtable
Airtable.configure({
  apiKey: airtableApiKey,
});

const base = Airtable.base(airtableBaseId);

// Function to check tables and their structures
async function pingAirtable() {
  try {
    console.log("Pinging Airtable...\n");
    
    // Test History table (articles)
    console.log("HISTORY TABLE (ARTICLES):");
    const historyRecords = await base('History').select({ maxRecords: 1 }).firstPage();
    if (historyRecords.length > 0) {
      const record = historyRecords[0];
      console.log("Sample record:");
      console.log(`ID: ${record.id}`);
      console.log("Fields:");
      const fields = record.fields;
      Object.keys(fields).forEach(key => {
        console.log(`  ${key}: ${JSON.stringify(fields[key])}`);
      });
    } else {
      console.log("No records found in History table");
    }
    
    // Test Teams table
    console.log("\nTEAMS TABLE:");
    const teamRecords = await base('Teams').select({ maxRecords: 1 }).firstPage();
    if (teamRecords.length > 0) {
      const record = teamRecords[0];
      console.log("Sample record:");
      console.log(`ID: ${record.id}`);
      console.log("Fields:");
      const fields = record.fields;
      Object.keys(fields).forEach(key => {
        console.log(`  ${key}: ${JSON.stringify(fields[key])}`);
      });
    } else {
      console.log("No records found in Teams table");
    }
    
    // Test Quotes table
    console.log("\nCAROUSELQUOTE TABLE:");
    const quoteRecords = await base('CarouselQuote').select({ maxRecords: 1 }).firstPage();
    if (quoteRecords.length > 0) {
      const record = quoteRecords[0];
      console.log("Sample record:");
      console.log(`ID: ${record.id}`);
      console.log("Fields:");
      const fields = record.fields;
      Object.keys(fields).forEach(key => {
        console.log(`  ${key}: ${JSON.stringify(fields[key])}`);
      });
    } else {
      console.log("No records found in CarouselQuote table");
    }

  } catch (error) {
    console.error("Error pinging Airtable:", error);
  }
}

// Run the ping function
pingAirtable();
