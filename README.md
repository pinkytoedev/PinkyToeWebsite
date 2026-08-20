# The Pinky Toe Website

**Feminist Humor, Right at Your Feet** 🦶✨

A modern full-stack web application serving feminist humor content, built with React and Express.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm**
- **Git**

#### Option 1: Railway (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-folder>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Login and link Railway** (for local env variables)
   ```bash
   npm i -g @railway/cli
   railway login
   railway link
   ```

4. **Start development server with Railway env**
   ```bash
   railway run npm run dev
   ```
   The app will start on `http://localhost:5000` (auto-fallbacks to `5001`, `5002`, etc. if the port is busy).
## 📊 Website Architecture

For a detailed understanding of how the website works, see the [Website Logic Flow Diagram](WEBSITE_FLOW_DIAGRAM.md).

## 📁 Project Structure

```
PinkyToeWebsite/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components  
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
│   ├── index.html
│   └── public/
├── server/                # Express backend
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic services
│   ├── storage.ts         # Data layer (Airtable + fallback)
│   ├── storage-cached.ts  # Caching wrapper
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
├── cache/                 # Cached data files
├── uploads/              # User uploaded files
└── tests/                # Unit and integration tests
```

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload (auto-finds available port) |
| `npm run dev:interactive` | Start dev server with interactive port conflict resolution |
| `npm run dev:port` | Start dev server on port 5001 (alternative port) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run check` | Type check with TypeScript |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

### Port Management

The development server intelligently handles port conflicts:

- **Automatic Port Selection**: If port 5000 is busy, the server automatically tries the next available port
- **Environment Variable**: Set a custom port with `PORT=3000 npm run dev`
- **Interactive Mode**: Use `npm run dev:interactive` for manual control over port conflicts
- **Check Port Usage**: Run `node scripts/check-port.js 5000` to see what's using a specific port

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Airtable Configuration (Optional - app works with test data if not provided)
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here

# Server Configuration
NODE_ENV=development  # or 'production'
PORT=5000            # Server port (default: 5000, auto-increments if busy)
HOST=0.0.0.0         # Server host (default: 0.0.0.0)

# Required in production - see .env.example for the full list
ADMIN_TOKEN=         # Gates POST /api/admin/refresh and /api/cache/refresh
WEBHOOK_SECRET=      # Gates POST /api/webhooks/*
```

See [`.env.example`](.env.example) for every supported variable, including the
optional `IMAGE_HOST_ALLOWLIST` and `LOG_REQUESTS`.

> **Note:** `ADMIN_TOKEN` and `WEBHOOK_SECRET` are optional in development (the
> endpoints stay open) but **required in production** - those routes return 503
> when unset, because each call forces a full Airtable re-fetch.

### Development vs Production

#### Development Mode
- **Automatic fallback**: If Airtable credentials are missing, the app automatically uses `MemStorage` with rich test data
- **Hot reload**: Frontend and backend reload automatically on changes
- **Detailed logging**: Comprehensive console output for debugging
- **Vite dev server**: Fast development builds

#### Production Mode  
- **Optimized builds**: Minified and optimized for performance
- **Static file serving**: Express serves built React app
- **Production caching**: Aggressive caching for better performance
- **Error handling**: Graceful error pages and API responses

## 📊 Data Layer Architecture

The application uses a flexible data layer that supports both live data and development:

### Storage Implementation
- **`AirtableStorage`**: Connects to Airtable for live data
- **`MemStorage`**: In-memory storage with rich test data
- **`CachedStorage`**: Caching wrapper for performance

### Automatic Fallback
```typescript
// Automatically chooses the right storage based on environment
export const storage: IStorage = process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID
  ? new AirtableStorage()
  : new MemStorage();
```

### Test Data Includes
- **Articles**: Feminist comedy articles with rich content
- **Team Members**: Author profiles with bios and photos
- **Quotes**: Inspirational and humorous quotes
- **Categories**: Article categorization and tagging

## 🧪 Testing

Unit tests currently cover:

- **Caching contract**: `CachedStorage` pagination and cache-completeness rules
- **Refresh scheduling**: business-hours timer wiring and shutdown
- **Security boundaries**: admin/webhook auth, image-proxy allowlist, Airtable
  formula escaping, article HTML sanitization
- **Utilities and one component**: formatting helpers and the site header

Not yet covered: the Airtable storage layer, `CacheService` file I/O, and the
HTTP routes end to end. `supertest` is installed for the latter.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Generate a coverage report
npm run test:coverage
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Deployment Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure Airtable credentials (optional)
- [ ] Run `npm run build` to create optimized build
- [ ] Start with `npm start`
- [ ] Verify all routes work correctly
- [ ] Check image proxying and caching

## 🔍 Key Features

### Content Management
- **Dynamic articles** with rich text content
- **Team member profiles** with photos and bios
- **Quote carousel** with daily quotes
- **Search and filtering** across content

### Performance Features
- **Image proxying** for external images
- **Smart caching** with automatic refresh
- **Background data updates** without blocking UI
- **Optimized builds** for fast loading

### Developer Experience
- **TypeScript** throughout for type safety
- **Hot reload** for rapid development
- **Comprehensive logging** for debugging
- **Automatic fallbacks** for missing data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Submit a pull request

### Development Guidelines
- Write tests for new features
- Maintain TypeScript type safety
- Follow existing code style
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License.

---

Made with ❤️ and feminist furriee; The Pinky Toe Team
