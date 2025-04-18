# Imgur to PostImages Migration Guide

This guide provides instructions for migrating images from Imgur to PostImages.org for Pinky Toe Paper website. We've provided several tools to help with this process, from fully automated to manual migration options.

## Prerequisites

Before running any migration scripts, you need to have the following environment variables set:

- `AIRTABLE_API_KEY`: Your Airtable API key
- `AIRTABLE_BASE_ID`: Your Airtable Base ID

You can set these by creating a `.env` file in the root directory of your project with the following content:

```
AIRTABLE_API_KEY=your_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
```

## Migration Options

We've provided three different approaches to migration, based on your preference and technical comfort level:

### Option 1: Extract Imgur Links (Recommended First Step)

This script extracts all Imgur links from your Airtable database and creates a CSV file with the information. This is useful for understanding the scope of the migration.

```bash
node extract_imgur_links.js
```

This will create a file called `imgur_links.csv` with details of all records that need to be migrated.

### Option 2: Manual Migration Helper (Recommended for Most Users)

This script provides a semi-automated approach:

1. It downloads the Imgur images to your local machine
2. Prompts you to manually upload them to PostImages.org
3. Allows you to paste the new URL back, and it will update Airtable

```bash
node manual_imgur_migration.js
```

Follow the on-screen instructions for each image. This approach is the most reliable as it allows you to manually verify each upload.

### Option 3: Fully Automated Migration (Advanced)

This script attempts to fully automate the process using Puppeteer to control a headless browser:

```bash
node imgur_to_postimages_migration.js
```

Note that this approach might be less reliable in some environments due to browser automation challenges. The TypeScript version of this script is also available if preferred.

## How the Migration Works

1. For each article in Airtable, the script checks if it has an Imgur link in the `MainImageLink` field
2. It extracts the Imgur image ID and downloads the image
3. The image is uploaded to PostImages.org (either manually or automatically)
4. The `MainImageLink` field in Airtable is updated with the new PostImages.org URL
5. The temporary downloaded image is deleted

## Troubleshooting

- **Image Download Errors**: Sometimes Imgur images might be in PNG format instead of JPG. The manual migration helper offers a fallback option for this case.
- **Browser Automation Issues**: If the automated script fails, try the manual migration helper instead.
- **Rate Limiting**: Both Imgur and PostImages may have rate limits. The scripts include delays to mitigate this, but you might need to wait if you hit rate limits.

## After Migration

Once migration is complete, your Airtable database will have PostImages.org URLs in the `MainImageLink` field. No changes to the website code are necessary as it already supports the new URLs.

## Notes

- The migration only updates the `MainImageLink` field in the Articles table
- The scripts skip records that already have PostImages URLs
- All scripts create and clean up a temporary directory for downloaded images