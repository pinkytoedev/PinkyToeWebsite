import { Router, Request, Response } from 'express';
import { CacheService } from '../services/cache-service';
import {
  RefreshService,
  REFRESHABLE_ENTITIES,
  isRefreshableEntity,
} from '../services/refresh-service';
import { requireAdmin } from '../middleware/auth';

export const adminRouter = Router();

// Every admin route invalidates caches and forces Airtable traffic.
adminRouter.use(requireAdmin);

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

    if (!isRefreshableEntity(entity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid entity type. Valid options are: ${REFRESHABLE_ENTITIES.join(', ')}`
      });
    }

    await RefreshService.invalidateAndRefresh(entity);

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