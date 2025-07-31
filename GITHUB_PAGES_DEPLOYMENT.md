# GitHub Pages Deployment Guide

This guide explains how to deploy The Pinky Toe website to GitHub Pages.

## Prerequisites

1. Ensure you have Node.js installed (version 20 or higher recommended)
2. Make sure all dependencies are installed: `npm install`
3. Ensure the cache directory contains up-to-date JSON files with your content

## Deployment Steps

### 1. Build the Static Site

Run the GitHub Pages build command:

```bash
npm run build:gh-pages
```

This command will:
- Build the site with Vite using the GitHub Pages configuration
- Set the base path to `/PinkyToeWebsite/`
- Copy all cached JSON data files to the build directory
- Use hash-based routing for client-side navigation

### 2. Enable GitHub Pages

1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the left sidebar
3. Under "Build and deployment":
   - Source: Deploy from a branch
   - Branch: Select `gh-pages` (will be created by the workflow)
   - Folder: `/ (root)`
4. Click Save

### 3. Push to GitHub

The GitHub Actions workflow will automatically deploy when you push to the main branch:

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### 4. Access Your Site

After deployment (usually takes 2-5 minutes), your site will be available at:

```
https://[your-username].github.io/PinkyToeWebsite/
```

## Important Notes

### Hash-Based Routing

The GitHub Pages deployment uses hash-based routing (e.g., `/#/articles` instead of `/articles`) to ensure proper client-side routing without server-side configuration.

### Static Data

The site uses static JSON files from the `cache` directory. To update content:

1. Update the JSON files in the `cache` directory
2. Rebuild and redeploy: `npm run build:gh-pages`
3. Push changes to trigger automatic deployment

### Images

All images are served from the `uploads` directory and the `attached_assets` directory. These are automatically included in the build.

### API Limitations

Since GitHub Pages only serves static files, the following features are not available:
- Real-time data updates from Airtable
- Admin functionality
- Server-side caching
- Dynamic image optimization

### Testing Locally

To test the GitHub Pages build locally:

```bash
npm run build:gh-pages
npm run preview:gh-pages
```

Then open `http://localhost:4173/PinkyToeWebsite/` in your browser.

## Troubleshooting

### 404 Errors

If you see 404 errors:
- Check that the base path in URLs matches `/PinkyToeWebsite/`
- Ensure the 404.html file is present in the build output
- Verify that hash routing is working correctly

### Missing Images

If images are not loading:
- Check that image paths include the base path
- Verify that the uploads directory is included in the build
- Check browser console for specific error messages

### Build Failures

If the build fails:
- Check the GitHub Actions logs for specific errors
- Ensure all dependencies are properly installed
- Verify that the cache directory contains valid JSON files