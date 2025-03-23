/**
 * Generate Image Mapping Files
 * 
 * This script generates both the URL-to-filename mapping and the image-record-map files
 * based on the images that have been cached in the uploads directory.
 * 
 * It creates two files:
 * 1. url-to-filename-map.json - Maps original URLs to their cached filenames
 * 2. image-record-map.json - Maps cached files to their source record IDs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Paths to directories and files
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const CLEAN_UPLOADS_DIR = path.join(process.cwd(), 'clean_uploads');
const URL_MAP_FILE = path.join(process.cwd(), 'url-to-filename-map.json');
const IMAGE_RECORD_MAP_FILE = path.join(process.cwd(), 'image-record-map.json');

// Check existence of directories
if (!fs.existsSync(UPLOADS_DIR)) {
  console.error(`Uploads directory not found at ${UPLOADS_DIR}`);
  process.exit(1);
}

// Function to scan directory and get files
function getFiles(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(file => !file.startsWith('.')) // Exclude hidden files
      .map(file => ({
        filename: file,
        path: path.join(dir, file),
        stats: fs.statSync(path.join(dir, file))
      }))
      .filter(file => file.stats.isFile());
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

// Function to load an existing JSON file or return an empty object
function loadJsonOrEmpty(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
  }
  return {};
}

// Function to save a JSON file with proper formatting
function saveJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Successfully wrote ${filePath}`);
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// Function to backup existing mapping files before overwriting
function backupMappingFiles() {
  const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
  
  if (fs.existsSync(URL_MAP_FILE)) {
    const backupFile = `${URL_MAP_FILE}.${timestamp}.bak`;
    fs.copyFileSync(URL_MAP_FILE, backupFile);
    console.log(`Backed up URL mapping file to ${backupFile}`);
  }
  
  if (fs.existsSync(IMAGE_RECORD_MAP_FILE)) {
    const backupFile = `${IMAGE_RECORD_MAP_FILE}.${timestamp}.bak`;
    fs.copyFileSync(IMAGE_RECORD_MAP_FILE, backupFile);
    console.log(`Backed up image record mapping file to ${backupFile}`);
  }
}

// Function to generate URL to filename mapping
function generateUrlToFilenameMap() {
  // Load existing map to preserve any manual entries
  const existingMap = loadJsonOrEmpty(URL_MAP_FILE);
  const urlMap = { ...existingMap };
  
  // Process the cached files
  getFiles(UPLOADS_DIR).forEach(file => {
    // For each file, find entries in the image record map that might reference it
    // This is a heuristic approach - we're using the filename (which is an MD5 hash)
    // to identify possible URLs that might have generated this file
    
    // For now, we're just preserving existing mappings
    // In a future enhancement, we could parse cached URLs from server logs or other sources
    const fileHash = path.parse(file.filename).name; // Get just the hash part
    
    // Check if this file already exists in a reverse mapping
    // If not, we can't easily determine the original URL
    Object.entries(existingMap).forEach(([url, filename]) => {
      if (filename === file.filename) {
        urlMap[url] = filename;
      }
    });
  });
  
  return urlMap;
}

// Function to generate image record map
function generateImageRecordMap() {
  // Load existing map
  const existingMap = loadJsonOrEmpty(IMAGE_RECORD_MAP_FILE);
  const imageRecordMap = { ...existingMap };
  
  return imageRecordMap;
}

// Main execution
function main() {
  console.log('Generating image mapping files...');
  
  // Backup existing files
  backupMappingFiles();
  
  // Generate URL to filename map
  const urlMap = generateUrlToFilenameMap();
  saveJsonFile(URL_MAP_FILE, urlMap);
  console.log(`Generated URL to filename map with ${Object.keys(urlMap).length} entries`);
  
  // Generate image record map
  const imageRecordMap = generateImageRecordMap();
  saveJsonFile(IMAGE_RECORD_MAP_FILE, imageRecordMap);
  console.log(`Generated image record map with ${Object.keys(imageRecordMap).length} entries`);
  
  console.log('Done!');
}

main();