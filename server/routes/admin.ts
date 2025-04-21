import { Router, Request, Response } from 'express';
import { CacheService } from '../services/cache-service';
import { RefreshService } from '../services/refresh-service';

export const adminRouter = Router();

/**
 * Refresh all cached data
 * POST /api/admin/refresh
 * Invalidates all caches and triggers fresh data fetching from Airtable
 */
adminRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    console.log('Admin API: Refreshing all cached data');
    
    // First invalidate all caches
    CacheService.invalidateAllCaches();
    
    // Then trigger a refresh of all data
    await RefreshService.refreshAll();
    
    res.json({ 
      success: true, 
      message: 'All caches have been invalidated and data refreshed'
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to refresh cache data'
    });
  }
});

/**
 * Refresh specific entity cached data
 * POST /api/admin/refresh/:entity
 * Invalidates specific cache and triggers fresh data fetching for that entity
 */
adminRouter.post('/refresh/:entity', async (req: Request, res: Response) => {
  try {
    const { entity } = req.params;
    console.log(`Admin API: Refreshing ${entity} cached data`);
    
    // Validate entity type
    const validEntities = ['articles', 'featuredArticles', 'recentArticles', 'team', 'quotes'];
    if (!validEntities.includes(entity)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid entity type. Valid options are: ${validEntities.join(', ')}`
      });
    }
    
    // Handle the specific entity refresh
    switch (entity) {
      case 'articles':
        // Invalidate the specific cache and refresh the data
        CacheService.invalidateCache('articles');
        await RefreshService.refreshArticles();
        break;
        
      case 'featuredArticles':
        CacheService.invalidateCache('featuredArticles');
        await RefreshService.refreshFeaturedArticles();
        break;
        
      case 'recentArticles':
        CacheService.invalidateCache('recentArticles');
        await RefreshService.refreshRecentArticles();
        break;
        
      case 'team':
        CacheService.invalidateCache('team');
        await RefreshService.refreshTeam();
        break;
        
      case 'quotes':
        CacheService.invalidateCache('quotes');
        await RefreshService.refreshQuotes();
        break;
    }
    
    res.json({ 
      success: true, 
      message: `${entity} cache has been invalidated and refreshed`
    });
  } catch (error) {
    console.error('Error refreshing specific cache:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to refresh specific cache data'
    });
  }
});