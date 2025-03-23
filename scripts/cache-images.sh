#!/bin/bash
# Image Cache Management Script
# This script provides helpful commands for managing the image cache

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print a header
print_header() {
  echo -e "${BLUE}===============================================${NC}"
  echo -e "${BLUE}= $1${NC}"
  echo -e "${BLUE}===============================================${NC}"
}

# Check if command is provided
if [ $# -eq 0 ]; then
  print_header "Image Cache Management Tool"
  echo -e "${YELLOW}Usage:${NC} $0 [command]"
  echo ""
  echo -e "${GREEN}Available commands:${NC}"
  echo -e "  ${YELLOW}refresh${NC}      - Refresh the image cache without forcing redownload"
  echo -e "  ${YELLOW}force-refresh${NC} - Force refresh all images, even if they're already cached"
  echo -e "  ${YELLOW}clear${NC}        - Clear the image cache"
  echo -e "  ${YELLOW}backup${NC}       - Create a backup of the current image cache"
  echo -e "  ${YELLOW}restore${NC}      - Restore the image cache from the most recent backup"
  echo -e "  ${YELLOW}status${NC}       - Show the current status of the image cache"
  echo -e "  ${YELLOW}help${NC}         - Show this help message"
  exit 0
fi

# Set up paths
SCRIPT_DIR="$(dirname "$0")"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
UPLOADS_DIR="$ROOT_DIR/uploads"
BACKUP_DIR="$ROOT_DIR/clean_uploads"

# Main command handling
case "$1" in
  refresh)
    print_header "Refreshing image cache"
    echo "This will keep existing images and only download missing ones."
    echo "Running cache script..."
    node "$SCRIPT_DIR/direct-airtable-cache.js"
    ;;
    
  force-refresh)
    print_header "Force refreshing all images"
    echo "This will delete and re-download all images."
    echo "Creating backup of current cache first..."
    mkdir -p "$BACKUP_DIR"
    cp -r "$UPLOADS_DIR"/* "$BACKUP_DIR/" 2>/dev/null || echo "No files to backup."
    echo "Clearing image cache..."
    rm -rf "$UPLOADS_DIR"/*
    echo "Running cache script with force option..."
    node "$SCRIPT_DIR/direct-airtable-cache.js" --force
    ;;
    
  clear)
    print_header "Clearing image cache"
    echo "Creating backup of current cache first..."
    mkdir -p "$BACKUP_DIR"
    cp -r "$UPLOADS_DIR"/* "$BACKUP_DIR/" 2>/dev/null || echo "No files to backup."
    echo "Removing all cached images..."
    rm -rf "$UPLOADS_DIR"/*
    rm -f "$ROOT_DIR/image-record-map.json" "$ROOT_DIR/url-to-filename-map.json"
    echo -e "${GREEN}Image cache cleared successfully${NC}"
    ;;
    
  backup)
    print_header "Creating backup of image cache"
    mkdir -p "$BACKUP_DIR"
    echo "Backing up cached images..."
    cp -r "$UPLOADS_DIR"/* "$BACKUP_DIR/" 2>/dev/null || echo "No files to backup."
    echo "Backing up mapping files..."
    cp "$ROOT_DIR/image-record-map.json" "$ROOT_DIR/image-record-map.json.bak" 2>/dev/null || echo "No image-record-map.json to backup."
    cp "$ROOT_DIR/url-to-filename-map.json" "$ROOT_DIR/url-to-filename-map.json.bak" 2>/dev/null || echo "No url-to-filename-map.json to backup."
    echo -e "${GREEN}Backup completed successfully${NC}"
    ;;
    
  restore)
    print_header "Restoring image cache from backup"
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
      echo -e "${RED}No backup found to restore.${NC}"
      exit 1
    fi
    echo "Restoring cached images..."
    mkdir -p "$UPLOADS_DIR"
    cp -r "$BACKUP_DIR"/* "$UPLOADS_DIR/" 2>/dev/null
    echo "Restoring mapping files..."
    [ -f "$ROOT_DIR/image-record-map.json.bak" ] && cp "$ROOT_DIR/image-record-map.json.bak" "$ROOT_DIR/image-record-map.json"
    [ -f "$ROOT_DIR/url-to-filename-map.json.bak" ] && cp "$ROOT_DIR/url-to-filename-map.json.bak" "$ROOT_DIR/url-to-filename-map.json"
    echo -e "${GREEN}Restore completed successfully${NC}"
    ;;
    
  status)
    print_header "Image Cache Status"
    if [ -d "$UPLOADS_DIR" ]; then
      IMAGE_COUNT=$(find "$UPLOADS_DIR" -type f | wc -l)
      echo -e "${YELLOW}Cached images:${NC} $IMAGE_COUNT"
      
      TOTAL_SIZE=$(du -sh "$UPLOADS_DIR" | cut -f1)
      echo -e "${YELLOW}Total cache size:${NC} $TOTAL_SIZE"
      
      if [ -f "$ROOT_DIR/image-record-map.json" ]; then
        RECORD_COUNT=$(grep -o '"id"' "$ROOT_DIR/image-record-map.json" | wc -l)
        echo -e "${YELLOW}Records with images:${NC} $RECORD_COUNT"
      else
        echo -e "${RED}No image-record mapping file found.${NC}"
      fi
      
      if [ -d "$BACKUP_DIR" ] && [ -n "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        BACKUP_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)
        BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
        echo -e "${YELLOW}Backup available:${NC} Yes ($BACKUP_COUNT images, $BACKUP_SIZE)"
      else
        echo -e "${YELLOW}Backup available:${NC} No"
      fi
    else
      echo -e "${RED}No image cache directory found.${NC}"
    fi
    ;;
    
  help)
    print_header "Image Cache Management Tool"
    echo -e "${YELLOW}Usage:${NC} $0 [command]"
    echo ""
    echo -e "${GREEN}Available commands:${NC}"
    echo -e "  ${YELLOW}refresh${NC}      - Refresh the image cache without forcing redownload"
    echo -e "  ${YELLOW}force-refresh${NC} - Force refresh all images, even if they're already cached"
    echo -e "  ${YELLOW}clear${NC}        - Clear the image cache"
    echo -e "  ${YELLOW}backup${NC}       - Create a backup of the current image cache"
    echo -e "  ${YELLOW}restore${NC}      - Restore the image cache from the most recent backup"
    echo -e "  ${YELLOW}status${NC}       - Show the current status of the image cache"
    echo -e "  ${YELLOW}help${NC}         - Show this help message"
    ;;
    
  *)
    echo -e "${RED}Unknown command: $1${NC}"
    echo "Run '$0 help' for usage information."
    exit 1
    ;;
esac

exit 0