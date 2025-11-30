# EternaBrand - AI Brand Guideline Assistant

[![CI/CD Pipeline](https://github.com/MuhammadAhmad-BigImmersive/AI-Brand-Guideline-Assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/MuhammadAhmad-BigImmersive/AI-Brand-Guideline-Assistant/actions/workflows/ci.yml)
[![Deployment Status](https://img.shields.io/badge/deployment-vercel-brightgreen)](https://vercel.com)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A comprehensive AI-powered brand guideline assistant that helps startups, freelancers, agencies, and creators build consistent brand experiences with automated generation, editing, and export capabilities.

## ✨ Features

### 🎨 Brand Builder

**Progressive 7-Step Generation System:**
- **Step 1: Brand Positioning** - Mission, Vision, Values, Target Audience
- **Step 2: Logo Guidelines** - Logo usage, variants, clear space, placement rules
- **Step 3: Color Palette** - Primary, secondary, accent colors with accessibility guidelines
- **Step 4: Typography** - Font families, weights, sizes, hierarchy, usage rules
- **Step 5: Iconography** - Icon style, grid system, usage guidelines
- **Step 6: Photography** - Photo mood, style, composition guidelines
- **Step 7: Applications** - Brand application examples and usage

**Key Capabilities:**
- AI-powered content generation using Google Gemini
- Industry-specific and vibe-aware content generation
- Interactive chatbot interface for brand information collection
- Real-time preview of generated guidelines
- Step-by-step approval workflow
- Logo upload and color extraction from logos
- Automatic color palette generation
- Vibe selection (Minimalistic, Maximalistic, Funky, Futuristic)

### 🌐 Mock Webpage Builder

**Four Distinct Design Vibes:**
- **Minimalistic** - Clean, simple, elegant designs
- **Maximalistic** - Bold, vibrant, expressive layouts
- **Funky** - Playful, creative, unconventional styles
- **Futuristic** - Modern, tech-forward, innovative aesthetics

**Features:**
- Dynamic HTML generation with React-based templates
- AI-generated content using Google Gemini
- Industry-specific image fetching from Unsplash API
- Brand-relevant image search (industry + brand name matching)
- Automatic color extraction from brand guidelines
- Dark/light theme detection and application
- Gradient generation based on brand colors
- Icon support with Lucide React icons
- Fully responsive designs
- Database persistence (survives logout/login)
- Download as HTML file
- View in new tab

### 📄 Preview & Edit System

**Editable Slides:**
- Real-time HTML preview of brand guidelines
- Click-to-edit text content
- Color picker for live color editing
- Drag & drop element repositioning
- Slide-by-slide navigation
- Export to editable PowerPoint (PPTX)
- Export to Google Slides
- Download as HTML

**Slide Management:**
- View all generated slides
- Navigate between slides
- Edit individual slide content
- Save changes to database
- Export options (PPTX, Google Slides, HTML)

### 📚 My Brands

**Brand Management:**
- View all saved brand guidelines
- Quick preview of brand details
- Delete brands
- Search and filter brands
- Sort by date (newest first)
- Brand information display (name, industry, vibe)
- Direct navigation to preview/edit

### 🔍 Brand Audit

- Website compliance checking
- Asset consistency analysis
- Automated fix suggestions
- Before/after previews
- Brand guideline violation detection

### ✨ Creative Generator

- Social media post generation
- Campaign creative creation
- Multi-platform format support
- Brand-consistent designs
- Template-based generation

### 🔐 Authentication & User Management

**Authentication Features:**
- Email/password signup and login
- Google OAuth integration
- Secure password hashing (bcrypt)
- Database sessions
- Email verification
- Password reset
- Protected routes
- Profile management
- Theme toggle (dark/light mode)

**User Features:**
- User dashboard with saved projects
- Brand guidelines history
- Session persistence
- User-specific data isolation

### 💾 Database & Persistence

**Data Storage:**
- PostgreSQL database with Drizzle ORM
- Brand guidelines storage
- Mock webpage persistence
- User session management
- Logo and asset storage
- Color palette storage
- Typography data storage
- Export file metadata

**Mock Page Persistence:**
- Mock pages saved to `brand_guidelines.mockPages` column
- Persists across logout/login sessions
- Automatic loading on preview page
- Database-first loading with local storage fallback

## 🛠️ Tech Stack

### Frontend
- **Framework**: SvelteKit with TypeScript
- **Styling**: TailwindCSS + shadcn-svelte components
- **Icons**: Lucide Svelte (frontend), Lucide React (mock pages)
- **UI Components**: shadcn-svelte component library
- **State Management**: Svelte stores and runes

### Backend
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Authentication**: Auth.js (SvelteKit Auth)
- **API**: SvelteKit API routes
- **File Processing**: Node.js file system operations

### AI & Services
- **AI Engine**: Google Gemini AI for content generation
- **Image Service**: Unsplash API for industry-specific images
- **Color Service**: Python FastAPI microservice for logo color extraction
- **Export Services**: 
  - PPTX generation (editable-pptx library)
  - Google Slides API integration

### React Templates
- **Minimalistic Template**: React + Vite + TailwindCSS
- **Maximalistic Template**: React + Vite + TailwindCSS
- **Funky Template**: React + Vite + TailwindCSS
- **Futuristic Template**: React + Vite + TailwindCSS

## 🚀 Getting Started

### Prerequisites

- Node.js >= 22.0.0
- PostgreSQL database
- Python 3.8+ (for color service)
- Google Gemini API key
- Unsplash API key (optional, for image fetching)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd AI-Brand-Guideline-Assistant
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup the Color Extraction Service**:
   ```bash
   ./setup-color-service.sh
   ```
   
   Or manually:
   ```bash
   cd color-service
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   
   # Authentication
   AUTH_SECRET=your-auth-secret-key
   AUTH_TRUST_HOST=true
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # AI Services
   GOOGLE_GEMINI_API=your-gemini-api-key
   
   # Image Service
   UNSPLASH_ACCESS_KEY=your-unsplash-access-key
   UNSPLASH_API_KEY=your-unsplash-api-key
   
   # Color Service
   COLOR_SERVICE_URL=http://localhost:8001
   
   # Google Slides (optional)
   GOOGLE_CLIENT_EMAIL=your-service-account-email
   GOOGLE_PRIVATE_KEY=your-private-key
   GOOGLE_PROJECT_ID=your-project-id
   ```

5. **Set up the database**:
   ```bash
   # Generate migrations
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Or use the setup script
   npm run db:setup
   ```

6. **Start the services**:

   **Option A: Using Docker (Recommended)**:
   ```bash
   docker-compose up
   ```

   **Option B: Manual**:
   ```bash
   # Terminal 1: Start color service
   cd color-service
   source venv/bin/activate
   python start.py
   
   # Terminal 2: Start SvelteKit
   npm run dev
   ```

7. **Open your browser**:
   - SvelteKit app: `http://localhost:5173`
   - Color service: `http://localhost:8001`

### Build React Templates

Before using mock webpage builder, build the React templates:

```bash
# Build all templates
cd react-templates/Minimalistic && npm install && npm run build && cd ../..
cd react-templates/Maximalistic && npm install && npm run build && cd ../..
cd react-templates/Funky && npm install && npm run build && cd ../..
cd react-templates/Futuristic && npm install && npm run build && cd ../..
```

Or use the build script if available:
```bash
npm run build:templates
```

## 📖 Project Structure

```
src/
├── routes/
│   ├── +layout.svelte              # Root layout
│   ├── +page.svelte                # Landing page
│   ├── auth/                       # Authentication routes
│   │   ├── login/                  # Login page
│   │   ├── signup/                 # Signup page
│   │   └── callback/               # OAuth callbacks
│   └── dashboard/
│       ├── +layout.svelte          # Dashboard layout with sidebar
│       ├── +page.svelte            # Dashboard home
│       ├── builder/                # Brand Builder
│       │   └── +page.svelte        # Progressive brand generation
│       ├── preview-html/           # Preview & Edit slides
│       │   └── +page.svelte        # HTML preview with editing
│       ├── my-brands/              # Brand management
│       │   └── +page.svelte        # My Brands list
│       ├── audit/                  # Brand Audit
│       │   └── +page.svelte        # Audit interface
│       └── creative/              # Creative Generator
│           └── +page.svelte        # Creative generation
├── lib/
│   ├── components/
│   │   ├── ui/                     # shadcn-svelte components
│   │   ├── editable-slides/        # Editable slide components
│   │   ├── BrandCard.svelte        # Brand card component
│   │   ├── SlideManager.svelte    # Slide management component
│   │   └── ThemeToggle.svelte      # Theme toggle
│   ├── services/
│   │   ├── brand-builder-analyzer.ts      # Prompt analysis
│   │   ├── industry-questions.ts          # Industry questions
│   │   ├── enhanced-progressive-generator.ts  # Progressive generation
│   │   ├── html-slide-generator.ts        # HTML slide generation
│   │   ├── editable-pptx-generator.ts     # PPTX export
│   │   ├── google-slides-generator.ts     # Google Slides export
│   │   └── image-fetcher.ts               # Image fetching
│   ├── db/
│   │   ├── schema.ts               # Database schema
│   │   └── index.ts                # Database connection
│   └── utils/                      # Utility functions
├── routes/api/
│   ├── brand-builder/              # Brand builder APIs
│   ├── brand-guidelines/           # Brand guidelines APIs
│   ├── build-mock-page/           # Mock page builder API
│   ├── mock-page-builder/         # Mock page templates
│   └── auth/                      # Authentication APIs
└── react-templates/               # React templates for mock pages
    ├── Minimalistic/              # Minimalistic vibe template
    ├── Maximalistic/              # Maximalistic vibe template
    ├── Funky/                     # Funky vibe template
    └── Futuristic/                # Futuristic vibe template
```

## 🎯 Key Features in Detail

### Brand Builder Flow

1. **Initial Prompt**: User provides brand information
2. **AI Analysis**: System analyzes prompt with Gemini AI
3. **Essential Questions**: Ask for missing critical info (brand name, industry, style)
4. **Industry Questions**: Generate industry-specific follow-up questions
5. **Progressive Generation**: Generate 7 steps one by one with user approval
6. **Color Extraction**: Extract colors from uploaded logo (if provided)
7. **Save & Export**: Save to database and export as PPTX/Google Slides

### Mock Webpage Builder Flow

1. **Select Vibe**: Choose from 4 design vibes
2. **Build Request**: System fetches brand guidelines from database
3. **Color Extraction**: Extract colors from brand guidelines
4. **Image Fetching**: Fetch industry-relevant images from Unsplash
5. **Content Generation**: Generate page content using Gemini AI
6. **HTML Generation**: Build complete HTML with inlined assets
7. **Database Save**: Save mock page to database
8. **Preview**: Display in iframe or new tab
9. **Download**: Download as HTML file

### Preview & Edit System

1. **Load Slides**: Fetch brand guidelines and generate HTML slides
2. **Edit Mode**: Click elements to edit text/colors
3. **Live Preview**: See changes in real-time
4. **Save Changes**: Save edited content to database
5. **Export Options**: Export as PPTX, Google Slides, or HTML

## 🔧 API Endpoints

### Brand Builder
- `POST /api/brand-builder/analyze-prompt` - Analyze user prompt
- `POST /api/brand-builder/industry-questions` - Get industry-specific questions
- `POST /api/brand-guidelines/enhanced-progressive` - Generate progressive steps

### Brand Guidelines
- `GET /api/brand-guidelines` - Get all brand guidelines
- `GET /api/brand-guidelines/[id]` - Get specific brand guideline
- `POST /api/brand-guidelines` - Create brand guideline
- `PUT /api/brand-guidelines/[id]` - Update brand guideline
- `DELETE /api/brand-guidelines/[id]` - Delete brand guideline

### Mock Pages
- `POST /api/build-mock-page` - Build mock webpage
- `GET /api/mockpagebuilder` - Get saved mock page (legacy)

### Export
- `POST /api/export-google-slides` - Export to Google Slides
- `POST /api/export-pptx` - Export to PowerPoint

## 🗄️ Database Schema

### Main Tables
- `user` - User accounts
- `brand_guidelines` - Brand guideline data
  - Includes: `mockPages` column for persistent mock webpage storage
- `generated_slides` - Generated slide data
- `brand_builder_chats` - Chat sessions
- `sessions` - User sessions

## 🚀 Deployment

### Deploy to Vercel (Recommended)

This application is optimized for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your Git repository to Vercel Dashboard for automatic deployments.

**Environment Variables for Vercel:**
- Set all environment variables from `.env` in Vercel dashboard
- Ensure `DATABASE_URL` is set for production database
- Configure `AUTH_SECRET` and other auth variables

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.**

## 🧪 Development

### Database Commands
```bash
npm run db:generate    # Generate migrations
npm run db:push       # Push schema to database
npm run db:studio     # Open Drizzle Studio
npm run db:migrate    # Run migrations
npm run db:setup      # Setup database
```

### Development Scripts
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run check         # Type check
npm run lint          # Lint code
npm run format        # Format code
```

## 📝 Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Authentication secret key
- `GOOGLE_GEMINI_API` - Google Gemini API key
- `UNSPLASH_ACCESS_KEY` - Unsplash API key
- `COLOR_SERVICE_URL` - Color extraction service URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This is a prototype project for demonstration purposes.

## 🙏 Acknowledgments

- SvelteKit team for the amazing framework
- shadcn for the component library
- Google Gemini for AI capabilities
- Unsplash for image API
- All contributors and users
