import { z } from "zod";

/**
 * Team Member Schema
 * Defines the structure for team member profiles
 * Supports both URL-based and file-based image storage
 * @property {string} id - Unique identifier (Airtable ID format)
 * @property {string} imageType - Specifies whether the image is stored as URL or file
 * @property {string} imagePath - Local file path for stored images (null for URL-based)
 */
export const teamSchema = z.object({
  id: z.string(), // Changed to string for Airtable IDs
  name: z.string(),
  role: z.string(),
  bio: z.string(),
  imageUrl: z.string(),
  imageType: z.enum(["url", "file"]),
  imagePath: z.string().nullable(),
  authorSub: z.array(z.string()).optional(), // Array of article IDs where this person is the author
  photoSub: z.array(z.string()).optional(), // Array of article IDs where this person provided photo credits
});

export type Team = z.infer<typeof teamSchema>;

/**
 * Article Schema
 * Defines the structure for blog articles
 * Supports rich text content and image management
 * @property {string} id - Unique identifier (Airtable ID format)
 * @property {string} excerpt - Short summary of the article
 * @property {string} content - Main article content in RTF format
 * @property {string} featured - Featured status of the article
 * @property {Date} publishedAt - Publication timestamp
 * @property {string} photoCredit - Attribution for article images
 */
export const articleSchema = z.object({
  id: z.string(), // Changed to string for Airtable IDs
  title: z.string(),
  description: z.string(),
  excerpt: z.string().optional(), // Added excerpt field
  content: z.string(),
  contentFormat: z
    .enum(["rtf", "markdown", "plaintext", "html"])
    .default("plaintext"),
  imageUrl: z.string(),
  imageType: z.enum(["url", "file"]),
  imagePath: z.string().nullable(),
  featured: z.boolean(),
  publishedAt: z.date(),
  name: z.string(), // Changed from author to "Name (from Author)"
  photo: z.string(),
  name_photo: z.string().optional(), // Changed from photoCredit to "Name (from Photo)"
  status: z.string().optional(),
  createdAt: z.date().optional(),
  hashtags: z.string().optional(),
});

export type Article = z.infer<typeof articleSchema>;

// Make sure the inferred Article type has featured as boolean
// This is automatically handled by z.infer but left as a comment for clarity

/**
 * Carousel Quote Schema
 * Defines the structure for testimonials and quotes displayed in carousels
 * @property {number} id - Unique identifier
 * @property {string} carousel - Identifier for the carousel this quote belongs to
 * @property {string} quote - The actual quote text
 */
export const carouselQuoteSchema = z.object({
  id: z.number(),
  carousel: z.string(),
  quote: z.string(),
});

export type CarouselQuote = z.infer<typeof carouselQuoteSchema>;
