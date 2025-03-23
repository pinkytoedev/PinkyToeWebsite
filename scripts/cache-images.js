/**
 * Image Caching Script
 * 
 * This script fetches all images from Airtable via our API endpoints
 * and triggers the caching mechanism by requesting each image through
 * the proxy route. This ensures all images are available locally even
 * if Airtable URLs expire.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// API endpoints to fetch data from
const API_BASE = 'http://localhost:5000/api';
const ENDPOINTS = {
  teamMembers: `${API_BASE}/team`,
  articles: `${API_BASE}/articles`,
  featuredArticles: `${API_BASE}/articles/featured`,
};

// Extract URL from imageUrl or photo field
function getImageUrls(item) {
  const urls = [];
  
  // Debug the item structure
  console.log(`Processing item: ${item.id || 'unknown'}`);
  console.log(`Item type: ${item.title ? 'Article' : item.name ? 'Team Member' : 'Unknown'}`);
  console.log(`Item data structure:`, JSON.stringify({
    hasImageUrl: !!item.imageUrl,
    imageUrlType: item.imageUrl ? typeof item.imageUrl : 'none',
    isImageUrlArray: item.imageUrl ? Array.isArray(item.imageUrl) : false,
    hasPhoto: !!item.photo,
    photoType: item.photo ? typeof item.photo : 'none',
    isPhotoArray: item.photo ? Array.isArray(item.photo) : false,
  }, null, 2));
  
  // Handle imageUrl which could be a string or array
  if (item.imageUrl) {
    if (typeof item.imageUrl === 'string') {
      if (item.imageUrl.startsWith('http')) {
        console.log(`Found imageUrl string: ${item.imageUrl.substring(0, 50)}...`);
        urls.push(item.imageUrl);
      }
    } else if (Array.isArray(item.imageUrl)) {
      item.imageUrl.forEach((img, index) => {
        if (img && typeof img === 'object' && img.url) {
          console.log(`Found imageUrl array item ${index}: ${img.url.substring(0, 50)}...`);
          urls.push(img.url);
        } else if (typeof img === 'string' && img.startsWith('http')) {
          console.log(`Found imageUrl string in array ${index}: ${img.substring(0, 50)}...`);
          urls.push(img);
        }
      });
    } else if (typeof item.imageUrl === 'object' && item.imageUrl !== null) {
      // Handle case where imageUrl is a single object with a url property
      if (item.imageUrl.url && typeof item.imageUrl.url === 'string') {
        console.log(`Found imageUrl object: ${item.imageUrl.url.substring(0, 50)}...`);
        urls.push(item.imageUrl.url);
      }
    }
  }
  
  // Handle photo field which could be a string or array
  if (item.photo) {
    if (typeof item.photo === 'string') {
      if (item.photo.startsWith('http')) {
        console.log(`Found photo string: ${item.photo.substring(0, 50)}...`);
        urls.push(item.photo);
      }
    } else if (Array.isArray(item.photo)) {
      item.photo.forEach((img, index) => {
        if (img && typeof img === 'object' && img.url) {
          console.log(`Found photo array item ${index}: ${img.url.substring(0, 50)}...`);
          urls.push(img.url);
        } else if (typeof img === 'string' && img.startsWith('http')) {
          console.log(`Found photo string in array ${index}: ${img.substring(0, 50)}...`);
          urls.push(img);
        }
      });
    } else if (typeof item.photo === 'object' && item.photo !== null) {
      // Handle case where photo is a single object with a url property
      if (item.photo.url && typeof item.photo.url === 'string') {
        console.log(`Found photo object: ${item.photo.url.substring(0, 50)}...`);
        urls.push(item.photo.url);
      }
    }
  }
  
  return urls;
}

// Function to cache a single image
async function cacheImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('http')) {
    console.log(`Skipping invalid URL: ${imageUrl}`);
    return;
  }
  
  try {
    console.log(`Caching image: ${imageUrl.substring(0, 100)}...`);
    
    // Request the image through our proxy to cache it
    // The image proxy route will handle the actual caching
    const encodedUrl = encodeURIComponent(imageUrl);
    const response = await fetch(`${API_BASE}/images/${encodedUrl}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      console.error(`Failed to cache image: ${response.status} ${response.statusText}`);
      return;
    }
    
    console.log(`Successfully cached image: ${imageUrl.substring(0, 50)}...`);
  } catch (error) {
    console.error(`Error caching image: ${error.message}`);
  }
}

// Search for URLs in a string
function extractUrlsFromString(text) {
  if (!text || typeof text !== 'string') return [];
  
  // Find all URLs in the text
  const urlRegex = /(https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|gif|webp))/gi;
  const matches = text.match(urlRegex);
  
  return matches || [];
}

// Recursively search an object for image URLs in any string properties
function findImageUrlsInContent(obj, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  if (!obj || typeof obj !== 'object') return [];
  
  let urls = [];
  
  for (const key in obj) {
    const value = obj[key];
    
    // Skip null values
    if (value === null) continue;
    
    // If this looks like a content field, search it for URLs
    if (typeof value === 'string' && 
        (key === 'content' || key === 'description' || key === 'text' || key === 'html')) {
      const extractedUrls = extractUrlsFromString(value);
      urls = [...urls, ...extractedUrls];
    }
    
    // Recursively search objects
    if (typeof value === 'object') {
      const nestedUrls = findImageUrlsInContent(value, maxDepth, currentDepth + 1);
      urls = [...urls, ...nestedUrls];
    }
  }
  
  return urls;
}

// Main function to fetch all data and cache images
async function cacheAllImages() {
  const allImageUrls = new Set();
  
  try {
    console.log('Starting image caching process...');
    
    // Fetch team members
    console.log('Fetching team members...');
    const teamResponse = await fetch(ENDPOINTS.teamMembers);
    const teamMembers = await teamResponse.json();
    console.log(`Found ${teamMembers.length} team members`);
    
    // Fetch all articles
    console.log('Fetching articles...');
    const articlesResponse = await fetch(ENDPOINTS.articles);
    const articlesData = await articlesResponse.json();
    const articles = articlesData.articles || [];
    console.log(`Found ${articles.length} articles`);
    
    // Fetch featured articles
    console.log('Fetching featured articles...');
    const featuredResponse = await fetch(ENDPOINTS.featuredArticles);
    const featuredArticles = await featuredResponse.json();
    console.log(`Found ${featuredArticles.length} featured articles`);
    
    // Collect all image URLs
    console.log('Collecting image URLs...');
    
    // From team members
    teamMembers.forEach(member => {
      const urls = getImageUrls(member);
      urls.forEach(url => allImageUrls.add(url));
      
      // Look for image URLs in content fields
      const contentUrls = findImageUrlsInContent(member);
      contentUrls.forEach(url => {
        console.log(`Found URL in team member content: ${url.substring(0, 50)}...`);
        allImageUrls.add(url);
      });
    });
    
    // From regular articles
    articles.forEach(article => {
      const urls = getImageUrls(article);
      urls.forEach(url => allImageUrls.add(url));
      
      // Look for image URLs in content fields
      const contentUrls = findImageUrlsInContent(article);
      contentUrls.forEach(url => {
        console.log(`Found URL in article content: ${url.substring(0, 50)}...`);
        allImageUrls.add(url);
      });
    });
    
    // From featured articles
    featuredArticles.forEach(article => {
      const urls = getImageUrls(article);
      urls.forEach(url => allImageUrls.add(url));
      
      // Look for image URLs in content fields
      const contentUrls = findImageUrlsInContent(article);
      contentUrls.forEach(url => {
        console.log(`Found URL in featured article content: ${url.substring(0, 50)}...`);
        allImageUrls.add(url);
      });
    });
    
    console.log(`Found ${allImageUrls.size} unique image URLs to cache`);
    
    if (allImageUrls.size === 0) {
      console.log('No image URLs found to cache. This could mean:');
      console.log('1. There are no images in the data');
      console.log('2. The Airtable API is not returning image URLs due to missing API key');
      console.log('3. The image URLs are stored in a different format');
      
      // Sample raw data for debugging
      console.log('\nSample data for debugging:');
      if (teamMembers.length > 0) {
        console.log('Sample team member:', JSON.stringify(teamMembers[0], null, 2));
      }
      if (articles.length > 0) {
        console.log('Sample article:', JSON.stringify(articles[0], null, 2));
      }
    } else {
      // Cache each image
      const promises = Array.from(allImageUrls).map(cacheImage);
      await Promise.all(promises);
      
      console.log('Image caching completed successfully!');
    }
  } catch (error) {
    console.error('Error during image caching:', error);
  }
}

// Check if server is running before starting
async function checkServerAndRun() {
  try {
    const response = await fetch(API_BASE);
    if (response.ok || response.status === 404) {
      // Server is running, start caching
      cacheAllImages();
    } else {
      console.error('Server is not responding properly. Please make sure the server is running.');
    }
  } catch (error) {
    console.error('Server is not running. Please start the server first with `npm run dev`.');
  }
}

// Run the script
checkServerAndRun();