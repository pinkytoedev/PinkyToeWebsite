import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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
  author: z.string(),
  photo: z.string(),
  photoCredit: z.string().optional(), // Added photo credit field
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

// Admin schema definition for authentication
export const adminSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  lastLogin: z.date().optional(),
});

export type Admin = z.infer<typeof adminSchema>;

// Form validation schema for admin login
export const insertAdminSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

// Database tables
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  airtableId: text("airtable_id").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  bio: text("bio").notNull(),
  imageUrl: text("image_url").notNull(),
  imageType: text("image_type").notNull(),
  imagePath: text("image_path"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  airtableId: text("airtable_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  contentFormat: text("content_format").notNull().default("plaintext"),
  imageUrl: text("image_url").notNull(),
  imageType: text("image_type").notNull(),
  imagePath: text("image_path"),
  featured: text("featured").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  author: text("author").notNull(),
  photo: text("photo").notNull(),
  photoCredit: text("photo_credit"),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow(),
  hashtags: text("hashtags"),
});

export const carouselQuotes = pgTable("carousel_quotes", {
  id: serial("id").primaryKey(),
  carousel: text("carousel").notNull(),
  quote: text("quote").notNull(),
});

export const imageAssets = pgTable("image_assets", {
  id: serial("id").primaryKey(),
  originalFilename: text("original_filename").notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  hash: text("hash").notNull(),
  isDefault: boolean("is_default").default(false),
  category: text("category").default("general"),
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata"),
});

// Export types
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

export type ArticleRecord = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

export type CarouselQuoteRecord = typeof carouselQuotes.$inferSelect;
export type InsertCarouselQuote = typeof carouselQuotes.$inferInsert;

export type ImageAsset = typeof imageAssets.$inferSelect;
export type InsertImageAsset = typeof imageAssets.$inferInsert;

// Create insert schemas
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
});

export const insertCarouselQuoteSchema = createInsertSchema(carouselQuotes).omit({
  id: true,
});

export const insertImageAssetSchema = createInsertSchema(imageAssets).omit({
  id: true,
  createdAt: true,
});
