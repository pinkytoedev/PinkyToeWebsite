# Website Logic Flow Diagram

```mermaid
graph TD
    %% User Entry Points
    A[User Visits Website] --> B{Environment Check}
    
    %% Environment Setup
    B -->|Production| C[Express Serves Static Files]
    B -->|Development| D[Vite Dev Server + HMR]
    
    %% Storage Selection
    E[App Initialization] --> F{Airtable Credentials?}
    F -->|Yes| G[AirtableStorage]
    F -->|No| H[MemStorage with Test Data]
    G --> I[CachedStorage Wrapper]
    H --> I
    
    %% Main App Flow
    C --> J[React App Loads]
    D --> J
    J --> K[Route Resolution]
    
    %% Routes
    K -->|/| L[Home Page]
    K -->|/articles| M[Articles Page]
    K -->|/articles/:id| N[Article Detail]
    K -->|/team| O[Team Page]
    K -->|/team/:id| P[Team Detail]
    K -->|/privacy-policy| Q[Privacy Policy]
    K -->|404| R[Not Found Page]
    
    %% Data Flow
    L --> S[Fetch Featured Articles]
    L --> T[Fetch Recent Articles]
    L --> U[Fetch Daily Quote]
    
    M --> V[Fetch All Articles]
    M --> W[Search Filter Logic]
    M --> X[Pagination Logic]
    
    N --> Y[Fetch Article by ID]
    N --> Z[Render Article Content]
    
    O --> AA[Fetch Team Members]
    P --> BB[Fetch Team Member by ID]
    P --> CC[Fetch Articles by Author]
    
    %% API Layer
    S --> DD[/api/articles/featured]
    T --> EE[/api/articles/recent]
    U --> FF[/api/quotes/daily]
    V --> GG[/api/articles]
    Y --> HH[/api/articles/:id]
    AA --> II[/api/team]
    BB --> JJ[/api/team/:id]
    CC --> KK[/api/team/:id/articles]
    
    %% Caching System
    DD --> LL[CachedStorage]
    EE --> LL
    FF --> LL
    GG --> LL
    HH --> LL
    II --> LL
    JJ --> LL
    KK --> LL
    
    LL --> MM{Cache Valid?}
    MM -->|Yes| NN[Return Cached Data]
    MM -->|No| OO[Refresh from Storage]
    
    OO --> PP[Publication-Aware Scheduler]
    PP --> QQ{Business Hours?}
    QQ -->|Yes| RR[Higher Refresh Frequency]
    QQ -->|No| SS[Lower Refresh Frequency]
    
    RR --> TT[Update Cache]
    SS --> TT
    TT --> NN
    
    %% Image Handling
    NN --> UU{Contains Images?}
    UU -->|Yes| VV[Image Proxy Service]
    UU -->|No| WW[Return Data]
    
    VV --> XX[/api/images/:encodedUrl]
    XX --> YY[Cache External Images]
    YY --> ZZ[Serve Proxied Image]
    ZZ --> WW
    
    %% Admin Features
    AAA[Admin Console] --> BBB[/api/cache/status]
    AAA --> CCC[/api/cache/emergency-refresh]
    AAA --> DDD[refreshCachedData() function]
    
    %% Background Services
    EEE[RefreshService] --> FFF[Publication Scheduler]
    FFF --> GGG{Content Priority}
    GGG -->|Critical| HHH[30min/1hr intervals]
    GGG -->|Important| III[1hr/2hr intervals]  
    GGG -->|Stable| JJJ[3hr/6hr intervals]
    
    %% Error Handling
    KKK[Error Occurs] --> LLL{Environment}
    LLL -->|Development| MMM[Detailed Console Logging]
    LLL -->|Production| NNN[Graceful Error Pages]
    
    style A fill:#e1f5fe
    style G fill:#c8e6c9
    style H fill:#fff3e0
    style I fill:#f3e5f5
    style VV fill:#fce4ec
    style PP fill:#e8f5e8
```

## Key Components Explained

### 1. **Dual Storage System**
- **Production**: Uses AirtableStorage for live CMS data
- **Development**: Falls back to MemStorage with rich test data
- **Always**: Wrapped in CachedStorage for performance

### 2. **Publication-Aware Caching**
- **Business Hours** (9 AM - 5 PM EST, Mon-Fri): Higher refresh rates
- **Off Hours**: Lower refresh rates to conserve API calls
- **Content Tiers**:
  - Critical (homepage, recent articles): 30min/1hr
  - Important (all articles, featured): 1hr/2hr  
  - Stable (team, quotes): 3hr/6hr

### 3. **Image Proxy System**
- External images are proxied through `/api/images/`
- Caches images locally for performance
- Handles Imgur and other external image services

### 4. **Frontend Routes**
- **/** - Homepage with featured content and daily quote
- **/articles** - All articles with search and pagination
- **/articles/:id** - Individual article detail view
- **/team** - Team member profiles
- **/team/:id** - Individual team member with their articles
- **/privacy-policy** - Static privacy policy page

### 5. **Admin Features**
- Cache status monitoring (`/api/cache/status`)
- Emergency refresh capability (`/api/cache/emergency-refresh`)
- Console commands (`refreshCachedData()`)

### 6. **Development Features**
- Hot module replacement (HMR) with Vite
- Automatic port selection if 5000 is busy
- Comprehensive logging and debugging
- TypeScript throughout for type safety