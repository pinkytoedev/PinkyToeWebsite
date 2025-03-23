import { Router, Request, Response } from 'express';
import { ImageService } from '../services/image-service';
import { storage } from '../storage';
import fs from 'fs';
import path from 'path';

export const imagesRouter = Router();

/**
 * Image proxy route
 * Fetches and caches images from remote URLs (Airtable)
 * Used to handle expiring URLs from Airtable
 */
imagesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the article or team member to find the image URL
    const article = await storage.getArticleById(id);
    if (article && article.imageUrl) {
      const imagePath = await ImageService.fetchAndCacheImage(article.imageUrl, id);
      const contentType = path.extname(imagePath) === '.png' ? 'image/png' : 'image/jpeg';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      // Stream the file
      fs.createReadStream(imagePath).pipe(res);
      return;
    }
    
    // If not an article, try team member
    const teamMember = await storage.getTeamMemberById(id);
    if (teamMember && teamMember.imageUrl) {
      const imagePath = await ImageService.fetchAndCacheImage(teamMember.imageUrl, id);
      const contentType = path.extname(imagePath) === '.png' ? 'image/png' : 'image/jpeg';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      // Stream the file
      fs.createReadStream(imagePath).pipe(res);
      return;
    }
    
    // No image found
    res.status(404).json({ error: 'Image not found' });
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});