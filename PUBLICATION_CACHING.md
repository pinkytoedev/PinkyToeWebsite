# Publication-Aware Caching System

This document describes the enhanced caching system designed specifically for publication workflows.

## Overview

The caching system has been upgraded to be **publication-aware**, meaning it adapts its refresh patterns based on:

- **Business hours** (9 AM - 5 PM EST, Monday-Friday by default)
- **Content priority tiers** (Critical, Important, Stable)
- **Publication workflow needs**

## Content Priority Tiers

### Tier 1: Critical Content 
- **Content**: Recent articles, homepage content, breaking news
- **Business Hours**: Refreshes every 30 minutes
- **Off-Hours**: Refreshes every 60 minutes  
- **Cache Expiry**: 1.5 hours

### Tier 2: Important Content
- **Content**: All articles, featured articles
- **Business Hours**: Refreshes every 60 minutes
- **Off-Hours**: Refreshes every 2 hours
- **Cache Expiry**: 3 hours

### Tier 3: Stable Content  
- **Content**: Team members, quotes
- **Business Hours**: Refreshes every 3 hours
- **Off-Hours**: Refreshes every 6 hours
- **Cache Expiry**: 8 hours

## Key Improvements

### 1. **Eliminates Cache Gaps**
- Previous system: Cache could expire before refresh, causing API calls during user requests
- New system: Cache expiry is always longer than refresh intervals

### 2. **Publication-Optimized Scheduling**
- More frequent updates during active publishing hours (business hours)
- Conserves API calls during low-activity periods (nights/weekends)
- Prioritizes homepage content for best user experience

### 3. **Emergency Refresh Capability**
- Breaking news or urgent updates can trigger immediate refresh
- Bypasses normal throttling for critical content
- API endpoint: `POST /api/cache/emergency-refresh`

### 4. **Cache Warmup**
- Server starts with warm caches for immediate availability
- Critical content loads first, stable content in background
- Reduces cold start delays

## API Endpoints

### Emergency Refresh
```http
POST /api/cache/emergency-refresh
```
Immediately refreshes critical content (recent articles, featured articles) bypassing throttling.

### Cache Status
```http
GET /api/cache/status  
```
Returns current scheduling information:
- Business hours status
- Current refresh intervals for each tier
- Cache expiry times
- Timestamp

## Configuration

The system can be configured via `PublicationScheduler.updateConfig()`:

```typescript
PublicationScheduler.updateConfig({
  timezone: 'America/New_York', // Publication timezone
  businessHours: {
    start: 9,  // 9 AM
    end: 17    // 5 PM  
  },
  businessDays: [1, 2, 3, 4, 5] // Monday-Friday
});
```

## Benefits for Publications

1. **Faster homepage loads**: Critical content refreshes frequently during business hours
2. **Reduced API costs**: Less frequent refreshes during off-hours
3. **Breaking news ready**: Emergency refresh for urgent updates
4. **Reliable caching**: No more cache expiry gaps causing slow responses
5. **Publication workflow aware**: Timing aligns with when content is most likely published

## Monitoring

The system logs scheduling context on startup and provides status endpoints for monitoring cache health and refresh patterns.

## Cache Locking System

The caching system implements a sophisticated file-based locking mechanism to prevent data corruption from concurrent cache operations. This is critical in a multi-process environment where multiple refresh operations might attempt to write to the same cache file simultaneously.

### Lock Implementation

The lock system uses temporary lock files stored in the `cache/locks/` directory:

```typescript
// Lock directory structure
cache/
├── locks/
│   ├── articles.lock
│   ├── featuredArticles.lock
│   ├── recentArticles.lock
│   ├── team.lock
│   └── quotes.lock
├── articles.json
├── featured-articles.json
├── recent-articles.json
├── team.json
└── quotes.json
```

### Lock Acquisition Process

```typescript
private static acquireLock(cacheType: string): boolean {
  try {
    const lockFile = path.join(LOCK_DIR, `${cacheType}.lock`);

    // Check if lock exists and is not stale
    if (fs.existsSync(lockFile)) {
      const lockStats = fs.statSync(lockFile);
      const lockAge = Date.now() - lockStats.mtimeMs;

      if (lockAge < LOCK_TIMEOUT) {
        // Lock is still valid, cannot acquire
        return false;
      } else {
        // Lock is stale, we can break it
        console.log(`Breaking stale lock for ${cacheType}`);
      }
    }

    // Create lock file with timestamp
    fs.writeFileSync(lockFile, Date.now().toString());
    return true;
  } catch (error) {
    console.error(`Error acquiring lock for ${cacheType}:`, error);
    return false;
  }
}
```

### Lock Features

#### 1. **Stale Lock Detection**
- **Timeout**: 30 seconds (configurable via `LOCK_TIMEOUT`)
- **Auto-recovery**: Stale locks are automatically broken and reacquired
- **Prevents deadlocks**: Ensures system doesn't hang on crashed processes

#### 2. **Atomic Cache Operations**
```typescript
static cacheArticles(data: { articles: Article[], total: number }): void {
  const cacheType = 'articles';
  
  // Try to acquire lock
  if (!this.acquireLock(cacheType)) {
    return; // Skip if lock cannot be acquired
  }
  
  try {
    // Validate data first
    if (!data || !data.articles || !Array.isArray(data.articles)) {
      return;
    }

    const cacheData: CacheData<{ articles: Article[], total: number }> = {
      data,
      timestamp: Date.now()
    };

    // Use temporary file for atomic write
    const tempFile = `${ARTICLES_CACHE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(cacheData, null, 2));
    
    // Atomic rename operation
    fs.renameSync(tempFile, ARTICLES_CACHE_FILE);
    
  } catch (error) {
    console.error('Error caching articles:', error);
  } finally {
    // Always release lock
    this.releaseLock(cacheType);
  }
}
```

#### 3. **Lock Release**
```typescript
private static releaseLock(cacheType: string): void {
  try {
    const lockFile = path.join(LOCK_DIR, `${cacheType}.lock`);
    
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  } catch (error) {
    console.error(`Error releasing lock for ${cacheType}:`, error);
  }
}
```

### Concurrency Scenarios

#### Scenario 1: Multiple Refresh Attempts
```
Process A: Acquires lock for 'articles' → Writes cache → Releases lock ✅
Process B: Attempts lock for 'articles' → Lock exists → Skips operation ⏭️
Process C: Attempts lock for 'articles' → Lock exists → Skips operation ⏭️
```

#### Scenario 2: Crashed Process Recovery
```
Process A: Acquires lock for 'team' → Crashes before release 💥
Process B: (35 seconds later) → Detects stale lock → Breaks lock → Acquires new lock ✅
```

#### Scenario 3: Emergency Refresh During Normal Operation
```
Scheduled Refresh: Acquires lock for 'featuredArticles' → Writing...
Emergency Refresh: Attempts lock for 'featuredArticles' → Lock busy → Skips ⏭️
Scheduled Refresh: Completes → Releases lock
Emergency Refresh: (next attempt) → Acquires lock → Writes cache ✅
```

### Lock Monitoring

The system logs lock operations for debugging:

```bash
# Terminal output examples
Recent articles cached successfully
Released lock for recentArticles
Featured articles cached successfully  
Released lock for featuredArticles
Breaking stale lock for articles (35s old)
Lock for team is held by another process (5s old)
```

### Benefits of the Lock System

1. **Data Integrity**: Prevents cache corruption from concurrent writes
2. **Process Safety**: Multiple server instances can run safely
3. **Automatic Recovery**: Stale locks don't cause permanent deadlocks  
4. **Performance**: Non-blocking - operations skip if lock unavailable
5. **Reliability**: Atomic file operations ensure cache consistency

### Lock Configuration

```typescript
// Lock timeout can be configured
const LOCK_TIMEOUT = 30 * 1000; // 30 seconds

// Lock directory is automatically created
const LOCK_DIR = path.join(CACHE_DIR, 'locks');
```

This locking mechanism ensures that the caching system remains robust and reliable even under high-concurrency scenarios, making it suitable for production environments with multiple server instances or frequent cache refresh operations.

## Backwards Compatibility

The new system is fully backwards compatible. Existing cache files and API responses remain unchanged - only the refresh timing logic has been enhanced.