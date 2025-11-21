import { Router } from 'express';
import { RefreshService } from '../services/refresh-service';
import { CacheService } from '../services/cache-service';

export const webhooksRouter = Router();

/**
 * Webhook endpoint for article publication events
 * 
 * This endpoint is called by your publishing platform whenever an article is published
 * to trigger an immediate cache refresh and update the website with the new content.
 * 
 * HTTP Method: POST
 * Content-Type: application/json
 * 
 * Request Body (optional):
 * {
 *   "event": "article.published",     // Event type (optional, for future extensibility)
 *   "articleId": "rec123456",          // The ID of the published article (optional)
 *   "timestamp": "2025-10-10T12:00:00Z", // Publication timestamp (optional)
 *   "webhookSecret": "your-secret-key" // Optional security token for validation
 * }
 * 
 * Success Response:
 * Status: 200 OK
 * {
 *   "success": true,
 *   "message": "Article publication webhook processed successfully",
 *   "timestamp": "2025-10-10T12:00:00Z",
 *   "refreshed": ["recentArticles", "featuredArticles", "articles"]
 * }
 * 
 * Error Response:
 * Status: 500 Internal Server Error
 * {
 *   "success": false,
 *   "message": "Error message",
 *   "timestamp": "2025-10-10T12:00:00Z"
 * }
 */
webhooksRouter.post('/article-published', async (req, res) => {
    const requestTimestamp = new Date().toISOString();

    try {
        // Optional: Validate webhook secret if provided in environment variables
        const expectedSecret = process.env.WEBHOOK_SECRET;
        if (expectedSecret && req.body.webhookSecret !== expectedSecret) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Invalid webhook secret',
                timestamp: requestTimestamp
            });
        }

        // Extract optional metadata from the webhook payload
        const { articleId, event, timestamp } = req.body;

        // Invalidate relevant caches to ensure fresh data
        CacheService.invalidateCache('recentArticles');
        CacheService.invalidateCache('featuredArticles');
        CacheService.invalidateCache('articles');

        // Trigger refresh of article-related data in priority order
        
        // Refresh in priority order: recent articles first (most visible to users)
        await RefreshService.refreshRecentArticles();
        
        // Then featured articles (homepage visibility)
        await RefreshService.refreshFeaturedArticles();
        
        // Finally all articles (complete catalog)
        await RefreshService.refreshArticles();

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Article publication webhook processed successfully',
            timestamp: requestTimestamp,
            refreshed: ['recentArticles', 'featuredArticles', 'articles'],
            metadata: {
                articleId: articleId || null,
                event: event || 'article.published',
                publicationTimestamp: timestamp || null
            }
        });
    } catch (error) {
        console.error('❌ Error processing article publication webhook:', error);

        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: requestTimestamp
        });
    }
});

/**
 * Webhook endpoint for team member updates
 * 
 * HTTP Method: POST
 * Content-Type: application/json
 * 
 * This endpoint can be used when team member information is updated
 */
webhooksRouter.post('/team-updated', async (req, res) => {
    const requestTimestamp = new Date().toISOString();

    try {
        // Optional: Validate webhook secret
        const expectedSecret = process.env.WEBHOOK_SECRET;
        if (expectedSecret && req.body.webhookSecret !== expectedSecret) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Invalid webhook secret',
                timestamp: requestTimestamp
            });
        }

        // Invalidate team cache
        CacheService.invalidateCache('team');

        // Refresh team data
        await RefreshService.refreshTeam();

        res.status(200).json({
            success: true,
            message: 'Team update webhook processed successfully',
            timestamp: requestTimestamp,
            refreshed: ['team']
        });
    } catch (error) {
        console.error('Error processing team update webhook:', error);

        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: requestTimestamp
        });
    }
});

/**
 * Health check endpoint for the webhook service
 * 
 * HTTP Method: GET
 * 
 * Use this to verify that the webhook service is running and accessible
 */
webhooksRouter.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'webhooks',
        timestamp: new Date().toISOString(),
        availableWebhooks: [
            'POST /api/webhooks/article-published',
            'POST /api/webhooks/team-updated'
        ]
    });
});

