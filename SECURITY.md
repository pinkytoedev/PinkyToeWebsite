# Security Guide

## Overview

The Pinky Toe Website is designed with security best practices in mind, particularly around API key management and deployment security.

## Security Architecture

### Development vs Production

#### Development Mode (Local Server)
- Uses Express.js server with server-side Airtable API calls
- API keys stored securely in `.env` file (excluded from Git)
- Environment variables only accessible server-side
- Automatic fallback to sample data if credentials missing

#### Production Mode (GitHub Pages)
- **Static files only** - no server-side code
- **No API keys** - uses pre-cached JSON data
- **No live Airtable connection** - completely secure from credential exposure
- **No environment variables** - everything is static

## Security Measures

### 1. API Key Protection

✅ **Secure Storage**: API keys stored in `.env` files  
✅ **Git Exclusion**: `.env` files excluded via `.gitignore`  
✅ **Server-Side Only**: Keys never sent to client  
✅ **Production Isolation**: GitHub Pages doesn't use live APIs  

### 2. Environment Variable Security

```bash
# ❌ NEVER do this (client-side exposure)
const apiKey = process.env.AIRTABLE_API_KEY; // In React component

# ✅ Correct (server-side only)
const apiKey = process.env.AIRTABLE_API_KEY; // In server/config.ts
```

### 3. Deployment Security

#### GitHub Pages Deployment
- Uses static build process
- No environment variables in build
- No server-side code execution
- Data comes from cached JSON files only

#### Local Development
- Environment variables loaded server-side only
- Client receives processed data, never raw credentials
- Automatic security validation on startup

## Security Best Practices

### For Developers

1. **Never commit `.env` files**
   ```bash
   # Already in .gitignore - but double-check!
   .env
   .env.local
   .env.production
   ```

2. **Use `.env.example` for setup**
   ```bash
   cp .env.example .env
   # Then edit .env with your actual credentials
   ```

3. **Validate your setup**
   - Run `npm run dev` to see security status
   - Check console for security warnings
   - Ensure no credentials in client-side code

### For Deployment

1. **GitHub Pages is secure by design**
   - No server-side code
   - No environment variables
   - Uses static JSON data only

2. **Never add secrets to GitHub Actions**
   - Current workflow doesn't need any secrets
   - All data comes from cached JSON files
   - No Airtable API calls during build

## Security Validation

The application includes automatic security validation:

```typescript
// Automatically runs on server startup
import { logSecurityStatus } from './server/security';
logSecurityStatus(); // Validates configuration
```

## Common Security Questions

### Q: Are API keys exposed in the browser?
**A**: No. API keys are server-side only in development, and GitHub Pages doesn't use them at all.

### Q: Is the GitHub Pages deployment secure?
**A**: Yes. It's completely static with no API connections or secrets.

### Q: What happens if I accidentally commit my .env file?
**A**: Immediately remove it from Git history and rotate your API keys:
```bash
git rm .env
git commit -m "Remove .env file"
# Then generate new API keys in Airtable
```

### Q: How do I update content on GitHub Pages?
**A**: Update the JSON files in the `cache/` directory, then rebuild and redeploy.

## Security Checklist

### Development Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Add your Airtable credentials to `.env`
- [ ] Verify `.env` is in `.gitignore`
- [ ] Run `npm run dev` and check security status

### Before Deployment
- [ ] Ensure no `.env` files committed
- [ ] Verify build doesn't include credentials
- [ ] Test GitHub Pages build locally
- [ ] Confirm all data comes from cache files

### Regular Maintenance
- [ ] Rotate API keys periodically
- [ ] Update cached data as needed
- [ ] Monitor for security warnings
- [ ] Keep dependencies updated

## Contact

If you discover a security issue, please report it responsibly by contacting the repository maintainers.