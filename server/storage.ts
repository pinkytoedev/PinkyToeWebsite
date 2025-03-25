import { Article, Team, CarouselQuote } from "@shared/schema";
import Airtable from "airtable";
import { ImageService } from "./services/image-service";

// Initialize Airtable
// Store these values when the module is first loaded
const airtableApiKey = process.env.AIRTABLE_API_KEY || "";
const airtableBaseId = process.env.AIRTABLE_BASE_ID || "";

// Log values for debugging
console.log('Airtable API Key configured length:', airtableApiKey ? airtableApiKey.length : 0);
console.log('Airtable Base ID configured:', airtableBaseId || 'NOT SET');

export interface IStorage {
  // Article methods
  getArticles(page: number, limit: number, search?: string): Promise<{ articles: Article[], total: number }>;
  getFeaturedArticles(): Promise<Article[]>;
  getRecentArticles(limit: number): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | undefined>;
  getArticlesByAuthorId(authorId: string): Promise<Article[]>;
  
  // Team methods
  getTeamMembers(): Promise<Team[]>;
  getTeamMemberById(id: string): Promise<Team | undefined>;
  
  // Quote methods
  getQuotes(): Promise<CarouselQuote[]>;
  getQuoteOfDay(): Promise<CarouselQuote>;
}

export class AirtableStorage implements IStorage {
  private base: Airtable.Base;
  private quotes: CarouselQuote[] = [];
  private quoteLastFetched: Date | null = null;
  
  constructor() {
    Airtable.configure({
      apiKey: airtableApiKey,
    });
    
    this.base = Airtable.base(airtableBaseId);
  }
  
  async getArticles(page: number, limit: number, search = ""): Promise<{ articles: Article[], total: number }> {
    try {
      // Create filter formula if search term is provided
      let filterByFormula = '';
      if (search) {
        // Search in both Name and Description fields
        filterByFormula = `OR(SEARCH("${search.replace(/"/g, '\\"')}", {Name}), SEARCH("${search.replace(/"/g, '\\"')}", {Description}))`;
      }
      
      // First get count of total records matching the search
      const countQuery = this.base('History').select({
        filterByFormula: search ? filterByFormula : ''
        // Remove fields parameter as 'id' is automatic in Airtable
      });
      
      const totalRecords = await countQuery.all();
      const total = totalRecords.length;
      
      // Then fetch the specific page of data - we need to fetch ALL records and do pagination manually
      // because Airtable offset doesn't work with arbitrary offset values
      const query = this.base('History').select({
        sort: [{ field: 'Date', direction: 'desc' }],
        filterByFormula: search ? filterByFormula : ''
      });
      
      // Get all records but manually paginate them
      const allRecords = await query.all();
      const start = (page - 1) * limit;
      const end = Math.min(start + limit, allRecords.length);
      
      // Make sure we don't go out of bounds
      const pageRecords = start < allRecords.length ? allRecords.slice(start, end) : [];
      const articles = pageRecords.map(this.mapAirtableRecordToArticle);
      
      return { articles, total };
    } catch (error) {
      console.error('Error fetching articles from Airtable:', error);
      return { articles: [], total: 0 };
    }
  }
  
  async getFeaturedArticles(): Promise<Article[]> {
    try {
      console.log('[DEBUG][AirtableStorage] Starting to fetch featured articles');
      console.log('[DEBUG][AirtableStorage] Airtable Base ID:', airtableBaseId);
      
      // Query for featured articles - checking if featured is true as a boolean
      const query = this.base('History').select({
        filterByFormula: "featured = TRUE()",
        sort: [{ field: 'Date', direction: 'desc' }],
        maxRecords: 5
      });
      
      // Start the request
      console.log('[DEBUG][AirtableStorage] Sending query to Airtable API');
      let records;
      try {
        records = await query.all();
        console.log(`[DEBUG][AirtableStorage] Successfully retrieved ${records.length} featured articles`);
      } catch (innerError) {
        console.error('[ERROR][AirtableStorage] Failed to retrieve records from Airtable:', innerError);
        
        // Try to determine the specific error type
        const errorString = String(innerError);
        if (errorString.includes('rate_limit_exceeded') || errorString.includes('429')) {
          console.error('[ERROR][AirtableStorage] Rate limit exceeded on Airtable API');
        } else if (errorString.includes('401') || errorString.includes('403')) {
          console.error('[ERROR][AirtableStorage] Authentication error with Airtable API. Check your API key permissions.');
        } else if (errorString.includes('404')) {
          console.error('[ERROR][AirtableStorage] Resource not found. Check your Base ID and table name.');
          console.error('[DEBUG][AirtableStorage] Base ID used:', airtableBaseId);
          console.error('[DEBUG][AirtableStorage] Table name used: History');
        } else if (errorString.includes('ENOTFOUND') || errorString.includes('ETIMEDOUT')) {
          console.error('[ERROR][AirtableStorage] Network error when contacting Airtable API');
        }
        
        throw innerError;
      }
      
      if (records.length === 0) {
        console.log('[DEBUG][AirtableStorage] No featured articles found, check your filtering criteria');
      }
      
      // Debug what fields are available in the records
      if (records.length > 0) {
        console.log('[DEBUG][AirtableStorage] Fields available in first record:', Object.keys(records[0].fields));
        console.log('[DEBUG][AirtableStorage] Featured field value:', records[0].get('featured'));
      }
      
      return records.map(this.mapAirtableRecordToArticle);
    } catch (error) {
      console.error('[ERROR][AirtableStorage] Error in getFeaturedArticles:', error);
      
      // In production, we should handle this more gracefully, but still throw for better error visibility
      if (process.env.NODE_ENV === 'production') {
        console.error('[ERROR][AirtableStorage] Production error caught, returning empty array but logging error');
        return [];
      }
      
      throw error;
    }
  }
  
  async getRecentArticles(limit: number): Promise<Article[]> {
    try {
      const query = this.base('History').select({
        sort: [{ field: 'Date', direction: 'desc' }],
        maxRecords: limit
      });
      
      const records = await query.all();
      return records.map(this.mapAirtableRecordToArticle);
    } catch (error) {
      console.error('Error fetching recent articles from Airtable:', error);
      return [];
    }
  }
  
  async getArticleById(id: string): Promise<Article | undefined> {
    try {
      const record = await this.base('History').find(id);
      return this.mapAirtableRecordToArticle(record);
    } catch (error) {
      console.error(`Error fetching article ${id} from Airtable:`, error);
      return undefined;
    }
  }
  
  async getArticlesByAuthorId(authorId: string): Promise<Article[]> {
    try {
      // Get team member to find their name
      const teamMember = await this.getTeamMemberById(authorId);
      if (!teamMember) return [];
      
      // Find all articles by this author
      const query = this.base('History').select({
        filterByFormula: `{Author} = '${teamMember.name.replace(/'/g, "\\'")}'`,
        sort: [{ field: 'Date', direction: 'desc' }],
        maxRecords: 10
      });
      
      const records = await query.all();
      return records.map(this.mapAirtableRecordToArticle);
    } catch (error) {
      console.error(`Error fetching articles for author ${authorId} from Airtable:`, error);
      return [];
    }
  }
  
  // Sample team members to use when Airtable access fails
  private getSampleTeamMembers(): Team[] {
    return [
      {
        id: 'sample1',
        name: 'Sarah Johnson',
        role: 'Editor-in-Chief',
        bio: 'Comedy writer and feminist scholar with a passion for empowering women through humor.',
        imageUrl: '/api/images/placeholder',
        imageType: 'url',
        imagePath: null
      },
      {
        id: 'sample2',
        name: 'Emily Rodriguez',
        role: 'Lead Writer',
        bio: 'Comedian and essayist focusing on intersectional feminism and representation in media.',
        imageUrl: '/api/images/placeholder',
        imageType: 'url',
        imagePath: null
      },
      {
        id: 'sample3',
        name: 'Jessica Lee',
        role: 'Staff Writer',
        bio: 'Cultural critic and humor writer exploring gender politics through a satirical lens.',
        imageUrl: '/api/images/placeholder',
        imageType: 'url',
        imagePath: null
      }
    ];
  }

  async getTeamMembers(): Promise<Team[]> {
    try {
      // Check if the table exists first by trying to access it
      const query = this.base('Teams').select({
        sort: [{ field: 'Name', direction: 'asc' }]
      });
      
      const records = await query.all();
      return records.map(this.mapAirtableRecordToTeamMember);
    } catch (error: any) {
      // Log detailed error information
      console.error('Error fetching team members from Airtable:', error);
      
      // If we have authorization issues, log a more specific message
      if (error.statusCode === 403) {
        console.warn('Authorization issue detected with Airtable Teams table. Check API key permissions.');
        console.log('Falling back to sample team members data');
        // Return sample team members when there's an authorization error
        return this.getSampleTeamMembers();
      } else if (error.statusCode === 404) {
        console.warn('Teams table not found in Airtable base. Check table name and base configuration.');
        console.log('Falling back to sample team members data');
        // Return sample team members when the table doesn't exist
        return this.getSampleTeamMembers();
      }
      
      // Return empty array for other errors
      return [];
    }
  }
  
  async getTeamMemberById(id: string): Promise<Team | undefined> {
    try {
      const record = await this.base('Teams').find(id);
      return this.mapAirtableRecordToTeamMember(record);
    } catch (error: any) {
      console.error(`Error fetching team member ${id} from Airtable:`, error);
      
      // If we have authorization issues, log a more specific message
      if (error.statusCode === 403) {
        console.warn(`Authorization issue detected with Airtable Teams table for ID ${id}. Check API key permissions.`);
        console.log('Falling back to sample team members data');
        // Return a sample team member when there's an authorization error
        const sampleTeamMembers = this.getSampleTeamMembers();
        // Try to find a sample member with the matching ID, or return the first one if not found
        return sampleTeamMembers.find(member => member.id === id) || sampleTeamMembers[0];
      } else if (error.statusCode === 404) {
        console.warn(`Team member with ID ${id} not found in Airtable or Teams table does not exist.`);
      }
      
      return undefined;
    }
  }
  
  async getQuotes(): Promise<CarouselQuote[]> {
    // Cache quotes for 1 hour
    const ONE_HOUR = 60 * 60 * 1000;
    
    if (this.quotes.length > 0 && this.quoteLastFetched && (Date.now() - this.quoteLastFetched.getTime() < ONE_HOUR)) {
      return this.quotes;
    }
    
    try {
      console.log('Fetching quotes from Airtable...');
      const query = this.base('CarouselQuote').select();
      const records = await query.all();
      
      // Debug: Log what fields are available in the records
      if (records.length > 0) {
        console.log('Available fields in Airtable CarouselQuote records:');
        console.log(Object.keys(records[0].fields));
      }
      
      let quoteId = 1;
      const mainQuotes: CarouselQuote[] = [];
      const philoQuotes: CarouselQuote[] = [];
      
      // Process each record and create two separate quotes from it (main and philo)
      records.forEach((record) => {
        // Check if the record has a "main" field 
        if ('main' in record.fields) {
          const mainQuoteText = record.get('main');
          if (mainQuoteText && String(mainQuoteText).trim() !== '') {
            mainQuotes.push({
              id: quoteId++,
              carousel: 'main',
              quote: String(mainQuoteText)
            });
            console.log(`Found main quote: "${mainQuoteText}"`);
          } else {
            console.log(`Record has empty "main" field`);
            // Create main quotes with placeholder if not already present
            // This is to ensure we have entries for "main" carousel for the UI
            if (mainQuotes.length === 0) {
              // Add a record with carousel type "main" with an empty quote
              mainQuotes.push({
                id: quoteId++,
                carousel: 'main',
                quote: ''
              });
            }
          }
        }
        
        // Check if the record has a "Philo" field
        if ('Philo' in record.fields) {
          const philoQuoteText = record.get('Philo');
          if (philoQuoteText && String(philoQuoteText).trim() !== '') {
            philoQuotes.push({
              id: quoteId++,
              carousel: 'Philo',
              quote: String(philoQuoteText)
            });
            console.log(`Found Philo quote: "${philoQuoteText}"`);
          } else {
            console.log(`Record has empty "Philo" field`);
          }
        }
      });
      
      // Combine all quotes and update the instance variable
      this.quotes = [...mainQuotes, ...philoQuotes];
      
      // Log the final quotes collection
      console.log(`Total quotes found: ${this.quotes.length} (${mainQuotes.length} main, ${philoQuotes.length} philo)`);
      
      this.quoteLastFetched = new Date();
      return this.quotes;
    } catch (error) {
      console.error('Error fetching quotes from Airtable:', error);
      return [];
    }
  }
  
  async getQuoteOfDay(): Promise<CarouselQuote> {
    const quotes = await this.getQuotes();
    
    // Filter for quotes of type "Philo" or "Philosophy" for the quote of the day
    const philosophyQuotes = quotes.filter(quote => 
      quote.carousel.toLowerCase() === 'philo' || 
      quote.carousel.toLowerCase() === 'philosophy'
    );
    
    if (philosophyQuotes.length === 0) {
      console.log('No philosophy quotes found, returning any available quote');
      
      if (quotes.length === 0) {
        console.log('No quotes available at all');
        return {
          id: 0,
          carousel: 'default',
          quote: ''
        };
      }
      
      // If no philosophy quotes, use any available quote
      const today = new Date();
      const start = new Date(today.getFullYear(), 0, 0);
      const diff = today.getTime() - start.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      
      const quoteIndex = dayOfYear % quotes.length;
      return quotes[quoteIndex];
    }
    
    // Use the day of year to select a quote deterministically from philosophy quotes
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const quoteIndex = dayOfYear % philosophyQuotes.length;
    return philosophyQuotes[quoteIndex];
  }
  
  private mapAirtableRecordToArticle(record: Airtable.Record<any>): Article {
    console.log('Processing Airtable record:', record.id);
    console.log('Available fields:', Object.keys(record.fields));
    
    // Get date field - try different possible field names
    const dateString = record.get('publishedAt') || record.get('Published Date') || record.get('Date') || record.get('created');
    const publishDate = dateString ? new Date(dateString as string) : new Date();
    
    // Get created date or fallback to published date
    const createdString = record.get('createdAt') || record.get('Created Date') || record.get('created');
    const createdDate = createdString ? new Date(createdString as string) : new Date();
    
    // Check if MainImage exists and log its contents
    if (record.get('MainImage')) {
      console.log('MainImage field found:', record.get('MainImage'));
    }
    
    // Handle image attachments - check for MainImage field first
    let imageUrl = '';
    const imageField = record.get('MainImage') || record.get('mainImage') || record.get('Image') || record.get('image') || record.get('Banner') || record.get('banner');
    
    if (imageField) {
      console.log(`Found image field for article "${record.get('Name') || record.id}":`, typeof imageField, Array.isArray(imageField) ? 'Array' : '');
      
      // Try to extract attachment data
      const attachment = ImageService.extractAttachmentFromField(imageField);
      if (attachment) {
        console.log(`Found image attachment for article "${record.get('Name') || record.id}":`, attachment.url);
        // Get the best URL from the attachment
        const bestUrl = ImageService.getBestAttachmentUrl(attachment);
        // Create a proxy URL using the actual image URL
        imageUrl = ImageService.getProxyUrl(bestUrl);
      }
    }
    
    // Fallback to URL fields if no attachment
    if (!imageUrl) {
      const directUrl = record.get('imageUrl') as string || record.get('Image URL') as string || '';
      if (directUrl) {
        console.log(`Using direct URL for article "${record.get('Name') || record.id}":`, directUrl);
        // Proxy the direct URL as well
        imageUrl = ImageService.getProxyUrl(directUrl);
      }
    }
    
    // Check photo field too
    const photoField = record.get('photo') || record.get('Photo');
    if (photoField) {
      console.log(`Photo field for article "${record.get('Name') || record.id}":`, typeof photoField, Array.isArray(photoField) ? 'Array' : '');
    }
    
    return {
      id: record.id,
      title: record.get('Name') as string || record.get('title') as string || record.get('Title') as string || '',
      description: record.get('description') as string || record.get('Description') as string || '',
      excerpt: record.get('excerpt') as string || record.get('Excerpt') as string || undefined,
      content: record.get('content') as string || record.get('Content') as string || record.get('Body') as string || '',
      contentFormat: record.get('contentFormat') as any || record.get('Content Format') as any || 
        // If content comes from Body field, assume it's HTML
        (record.get('Body') ? 'html' : 'plaintext'),
      imageUrl: imageUrl,
      imageType: 'url', // Always use URL type since we're proxying
      imagePath: null, // No need for local path when using proxy
      featured: record.get('featured') === true || record.get('Featured') === true,
      publishedAt: publishDate,
      name: record.get('Name (from Author)') as string || record.get('name') as string || record.get('Name') as string || record.get('author') as string || record.get('Author') as string || '',
      photo: record.get('photo') as string || record.get('Photo') as string || '',
      name_photo: record.get('Name (from Photo)') as string || record.get('name_photo') as string || record.get('photoCredit') as string || record.get('Photo Credit') as string || undefined,
      status: record.get('status') as string || record.get('Status') as string || undefined,
      createdAt: createdDate,
      hashtags: record.get('hashtags') as string || record.get('Hashtags') as string || undefined
    };
  }
  
  private mapAirtableRecordToTeamMember(record: Airtable.Record<any>): Team {
    console.log('Processing Airtable team record:', record.id);
    console.log('Available team member fields:', Object.keys(record.fields));
    
    // Check if MainImage exists and log its contents
    if (record.get('MainImage')) {
      console.log('MainImage field found for team member:', record.get('MainImage'));
    }
    
    // Handle image attachments - check for MainImage field first
    let imageUrl = '';
    const imageField = record.get('MainImage') || record.get('mainImage') || record.get('Image') || record.get('image') || record.get('Photo') || record.get('photo');
    
    if (imageField) {
      console.log(`Found image field for team member "${record.get('Name') || record.id}":`, typeof imageField, Array.isArray(imageField) ? 'Array' : '');
      
      // Try to extract attachment data
      const attachment = ImageService.extractAttachmentFromField(imageField);
      if (attachment) {
        console.log(`Found image attachment for team member "${record.get('Name') || record.id}":`, attachment.url);
        // Get the best URL from the attachment
        const bestUrl = ImageService.getBestAttachmentUrl(attachment);
        // Create a proxy URL using the actual image URL
        imageUrl = ImageService.getProxyUrl(bestUrl);
      }
    }
    
    // Fallback to URL fields if no attachment
    if (!imageUrl) {
      const directUrl = record.get('imageUrl') as string || record.get('Image URL') as string || '';
      if (directUrl) {
        console.log(`Using direct URL for team member "${record.get('Name') || record.id}":`, directUrl);
        // Proxy the direct URL as well
        imageUrl = ImageService.getProxyUrl(directUrl);
      }
    }
    
    // Check photo field too
    const photoField = record.get('photo') || record.get('Photo');
    if (photoField) {
      console.log(`Photo field for team member "${record.get('Name') || record.id}":`, typeof photoField, Array.isArray(photoField) ? 'Array' : '');
    }
    
    return {
      id: record.id,
      name: record.get('name') as string || record.get('Name') as string || '',
      role: record.get('role') as string || record.get('Role') as string || '',
      bio: record.get('bio') as string || record.get('Bio') as string || '',
      imageUrl: imageUrl,
      imageType: 'url', // Always use URL type since we're proxying
      imagePath: null // No need for local path when using proxy
    };
  }
}

// For development/testing when Airtable credentials are not available
export class MemStorage implements IStorage {
  private articles: Article[] = [];
  private teamMembers: Team[] = [];
  private quotes: CarouselQuote[] = [];
  
  constructor() {
    // Initialize with sample data for development
    this.initSampleData();
  }
  
  async getArticles(page: number, limit: number, search = ""): Promise<{ articles: Article[], total: number }> {
    let filteredArticles = this.articles;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredArticles = filteredArticles.filter(article => 
        (article.title || '').toLowerCase().includes(searchLower) ||
        (article.description || '').toLowerCase().includes(searchLower)
      );
    }
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedArticles = filteredArticles.slice(start, end);
    
    return {
      articles: paginatedArticles,
      total: filteredArticles.length
    };
  }
  
  async getFeaturedArticles(): Promise<Article[]> {
    return this.articles.filter(article => article.featured === true);
  }
  
  async getRecentArticles(limit: number): Promise<Article[]> {
    // Sort by published date (newest first)
    const sorted = [...this.articles].sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
    return sorted.slice(0, limit);
  }
  
  async getArticleById(id: string): Promise<Article | undefined> {
    return this.articles.find(article => article.id === id);
  }
  
  async getArticlesByAuthorId(authorId: string): Promise<Article[]> {
    const teamMember = await this.getTeamMemberById(authorId);
    if (!teamMember) return [];
    
    return this.articles.filter(article => article.name === teamMember.name);
  }
  
  async getTeamMembers(): Promise<Team[]> {
    return this.teamMembers;
  }
  
  async getTeamMemberById(id: string): Promise<Team | undefined> {
    return this.teamMembers.find(member => member.id === id);
  }
  
  async getQuotes(): Promise<CarouselQuote[]> {
    return this.quotes;
  }
  
  async getQuoteOfDay(): Promise<CarouselQuote> {
    if (this.quotes.length === 0) {
      return {
        id: 0,
        carousel: 'default',
        quote: 'In a world full of sharks, be a pinky toe - small but mighty enough to make someone curse when they least expect it.'
      };
    }
    
    // Use the day of year to select a quote deterministically
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const quoteIndex = dayOfYear % this.quotes.length;
    return this.quotes[quoteIndex];
  }
  
  private initSampleData() {
    // Sample team members
    this.teamMembers = [
      {
        id: 'rec1',
        name: 'Sarah Johnson',
        role: 'Editor-in-Chief',
        bio: 'Comedy writer and feminist scholar with a passion for empowering women through humor.',
        imageUrl: ImageService.getProxyUrl('https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),
        imageType: 'url',
        imagePath: null
      },
      {
        id: 'rec2',
        name: 'Emily Rodriguez',
        role: 'Lead Writer',
        bio: 'Comedian and essayist focusing on intersectional feminism and representation in media.',
        imageUrl: ImageService.getProxyUrl('https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),
        imageType: 'url',
        imagePath: null
      },
      {
        id: 'rec3',
        name: 'Jessica Lee',
        role: 'Staff Writer',
        bio: 'Cultural critic and humor writer exploring gender politics through a satirical lens.',
        imageUrl: ImageService.getProxyUrl('https://images.unsplash.com/photo-1581992652564-44c42f5ad3ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),
        imageType: 'url',
        imagePath: null
      }
    ];
    
    // Sample articles
    this.articles = [
      {
        id: 'article1',
        title: 'The Evolution of Feminist Comedy',
        description: 'How humor has been a powerful tool for feminist movements throughout history, breaking barriers and challenging stereotypes.',
        excerpt: 'A look at feminist comedy through the decades.',
        content: `Throughout history, women have used humor as a powerful tool to challenge patriarchal structures, break barriers, and advocate for equality. From the witty satires of Jane Austen to the groundbreaking stand-up of contemporary comedians, feminist humor has evolved significantly while maintaining its core purpose: to critique, challenge, and change the status quo.

The Early Pioneers

In the 19th century, writers like Jane Austen and Frances Burney used wit and irony to subtly critique society's expectations of women. While not overtly labeled as "feminist" in their time, their sharp observations of social hierarchies and marriage markets laid the groundwork for feminist humor that would follow.

The suffragette movement also employed humor effectively, using satirical cartoons and witty slogans to counter anti-suffrage arguments and humanize their cause. These early pioneers understood that laughter could be a disarming entry point for radical ideas.`,
        contentFormat: 'plaintext',
        imageUrl: ImageService.getProxyUrl('https://images.unsplash.com/photo-1533562669260-350775484a52?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),
        imageType: 'url',
        imagePath: null,
        featured: true,
        publishedAt: new Date('2023-08-24'),
        name: 'Sarah Johnson',
        photo: ImageService.getProxyUrl('https://images.unsplash.com/photo-1533562669260-350775484a52?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),
        name_photo: 'Photo by John Smith',
        status: 'published',
        createdAt: new Date('2023-08-20')
      },
      {
        id: 'article2',
        title: 'Finding Your Voice: Women in Comedy',
        description: 'Interviews with rising female comedians who are reshaping the landscape of humor and representation.',
        content: 'Full article content here...',
        contentFormat: 'plaintext',
        imageUrl: ImageService.getProxyUrl('https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),
        imageType: 'url',
        imagePath: null,
        featured: true,
        publishedAt: new Date('2023-07-15'),
        name: 'Emily Rodriguez',
        photo: ImageService.getProxyUrl('https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),
        name_photo: 'Photo by Jane Doe',
        status: 'published',
        createdAt: new Date('2023-07-10')
      },
      {
        id: 'article3',
        title: 'Breaking the Glass Ceiling in Comedy Writing',
        description: 'A look at the structural barriers women face in comedy writing rooms and the trailblazers breaking through.',
        content: 'Full article content here...',
        contentFormat: 'plaintext',
        imageUrl: ImageService.getProxyUrl('https://images.unsplash.com/photo-1496449903678-68ddcb189a24?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),
        imageType: 'url',
        imagePath: null,
        featured: false,
        publishedAt: new Date('2023-09-05'),
        name: 'Jessica Lee',
        photo: ImageService.getProxyUrl('https://images.unsplash.com/photo-1496449903678-68ddcb189a24?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'),
        name_photo: 'Photo by Sam Taylor',
        status: 'published',
        createdAt: new Date('2023-09-01')
      }
    ];
    
    // Sample quotes
    this.quotes = [
      {
        id: 1,
        carousel: 'main',
        quote: 'Feminism: the radical notion that women are people too!'
      },
      {
        id: 2,
        carousel: 'main',
        quote: 'In a world full of sharks, be a pinky toe - small but mighty enough to make someone curse when they least expect it.'
      },
      {
        id: 3,
        carousel: 'main',
        quote: 'Life is too short for boring shoes and men who don\'t get feminist jokes.'
      },
      {
        id: 4,
        carousel: 'Philo',
        quote: 'The pinky toe may be small, but it shoulders an unfair share of furniture encounters.'
      },
      {
        id: 5,
        carousel: 'Philo',
        quote: 'A pinky toe\'s strength isn\'t measured by its size, but by how loudly it makes you yell when it hits the coffee table.'
      }
    ];
  }
}

// Export appropriate storage implementation based on environment
// Add detailed logging to help debug environment variable issues
console.log('===== ENVIRONMENT DEBUG INFO =====');
console.log('Environment:', process.env.NODE_ENV);
console.log('Replit: Site ID:', process.env.REPL_ID, 'Owner:', process.env.REPL_OWNER);
console.log('Airtable API Key length:', process.env.AIRTABLE_API_KEY ? process.env.AIRTABLE_API_KEY.length : 0);
console.log('Airtable Base ID:', process.env.AIRTABLE_BASE_ID || 'NOT FOUND');
console.log('AIRTABLE_API_KEY exists:', !!process.env.AIRTABLE_API_KEY);
console.log('AIRTABLE_BASE_ID exists:', !!process.env.AIRTABLE_BASE_ID);
console.log('===== END DEBUG INFO =====');

// Create and export the appropriate storage implementation
let storage: IStorage;
if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
  console.log('Using Airtable storage with valid API credentials');
  try {
    storage = new AirtableStorage();
    console.log('Successfully initialized Airtable storage');
  } catch (error) {
    console.error('ERROR: Failed to initialize Airtable storage:', error);
    console.log('Falling back to memory storage due to initialization error');
    storage = new MemStorage();
  }
} else {
  console.log('WARNING: Missing Airtable credentials. Using fallback memory storage.');
  console.log('Make sure AIRTABLE_API_KEY and AIRTABLE_BASE_ID are set in your environment');
  storage = new MemStorage();
}

export { storage };
