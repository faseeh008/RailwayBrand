# EternaBrand - Development Guide

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Authentication Setup](#authentication-setup)
5. [Architecture Overview](#architecture-overview)
6. [Key Features](#key-features)
7. [API Endpoints](#api-endpoints)
8. [Development Workflow](#development-workflow)

---

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# 1. Install dependencies
npm install

# 2. Complete Docker setup (starts PostgreSQL, sets up database)
npm run docker:setup

# 3. Start development server with Docker database
npm run dev:docker
```

### Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup color service
cd color-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Setup database
npm run db:setup

# 4. Start services
# Terminal 1: Color service
cd color-service
python start.py

# Terminal 2: SvelteKit
npm run dev
```

---

## 🔧 Environment Setup

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/eternabrand_db"

# Authentication
AUTH_SECRET="your-super-secret-key-here-make-it-long-and-random"
AUTH_TRUST_HOST="true"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google AI (Required for brand generation)
GOOGLE_GEMINI_API="your-gemini-api-key"

# Email (Required for verification/reset)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@eternabrand.com"

# Color Service (Optional, defaults to localhost:8001)
COLOR_SERVICE_URL="http://localhost:8001"

# Site URL
PUBLIC_SITE_URL="http://localhost:5173"
```

---

## 🗄️ Database Setup

### Option A: Docker (Recommended)

```bash
npm run docker:setup
```

### Option B: Local PostgreSQL

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Or use the setup script
npm run db:setup
```

### Database Commands

```bash
npm run db:generate    # Generate migrations
npm run db:push       # Push schema to database
npm run db:studio     # Open Drizzle Studio
npm run db:migrate    # Run migrations
```

---

## 🔐 Authentication Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URIs:
   - `http://localhost:5173/auth/callback/google` (development)
   - `https://yourdomain.com/auth/callback/google` (production)

### Email Setup (Gmail Example)

1. Enable 2-factor authentication
2. Generate app password
3. Use app password in `EMAIL_SERVER_PASSWORD`

### Features Implemented

- ✅ Email/password signup & login
- ✅ Secure password hashing (bcrypt)
- ✅ Database sessions
- ✅ Email verification
- ✅ Password reset
- ✅ Google OAuth
- ✅ Protected routes
- ✅ Profile management

---

## 🏗️ Architecture Overview

### Tech Stack

- **Frontend**: SvelteKit with TypeScript
- **Styling**: TailwindCSS + shadcn-svelte components
- **Icons**: Lucide Svelte
- **Backend**: Drizzle ORM + PostgreSQL
- **Authentication**: Auth.js (SvelteKit)
- **AI**: Google Gemini AI for brand guideline generation
- **Color Service**: Python FastAPI microservice for logo analysis

### Project Structure

```
src/
├── routes/
│   ├── dashboard/
│   │   ├── builder/          # Brand builder with progressive generation
│   │   ├── preview-html/     # HTML-based slide preview & editing
│   │   ├── audit/            # Brand compliance auditing
│   │   ├── history/          # Saved brand guidelines
│   │   └── creative/         # Creative generator
│   └── api/                  # API endpoints
├── lib/
│   ├── components/           # UI components
│   │   ├── editable-slides/  # Editable slide components
│   │   └── ui/              # shadcn-svelte components
│   ├── services/            # Business logic
│   │   ├──         # AI generation service
│   │   ├── html-slide-generator.ts  # HTML slide generation
│   │   ├── editable-pptx-generator.ts  # PPTX export
│   │   └── ...
│   ├── db/                  # Database schema & connection
│   └── utils/               # Utility functions
```

---

## 🎯 Key Features

### 1. Progressive Brand Generation

The Brand Builder uses a 7-step progressive generation system:

1. **Brand Positioning** - Mission, Vision, Values
2. **Logo Guidelines** - Logo usage, variants
3. **Color Palette** - Primary, secondary colors
4. **Typography** - Fonts, weights, usage
5. **Iconography** - Icon style, grid
6. **Photography** - Photo mood, guidelines
7. **Applications** - Brand applications

**Key Components:**
- `src/lib/components/ProgressiveGenerator.svelte` - Main component
- `src/routes/api/brand-guidelines/progressive/+server.ts` - API endpoint
- `src/lib/services/neration service

### 2. Editable Slides System

Fully editable slides with real-time preview:

- **HTML Preview**: Edit slides in browser before export
- **Real PPTX Elements**: Download editable PowerPoint files
- **Drag & Drop**: Reposition elements on enhanced slides
- **Color Pickers**: Live color editing
- **Text Editing**: Click and edit any text

**Key Components:**
- `src/routes/dashboard/preview-html/+page.svelte` - Main preview page
- `src/lib/components/editable-slides/*.svelte` - Editable slide components
- `src/lib/services/editable-pptx-generator.ts` - PPTX generation

### 3. Brand Audit System

Website compliance checking:

- Upload brand guidelines PDF
- Scrape website for analysis
- Compare compliance
- Generate fix suggestions

**Key Components:**
- `src/routes/dashboard/audit/+page.svelte` - Audit interface
- `src/lib/services/audit/*.js` - Analysis services
- `src/lib/services/web-scraping/*.js` - Web scraping services

---

## 🔌 API Endpoints

### Brand Guidelines

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/brand-guidelines/progressive` | POST | Generate single step |
| `/api/brand-guidelines/comprehensive` | POST | Save complete guidelines |
| `/api/brand-guidelines/[id]` | GET | Retrieve saved guidelines |
| `/api/brand-guidelines/by-name` | GET | Get by brand name |

### Generation & Export

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate-step-titles` | POST | Generate custom step titles |
| `/api/generate-slides-html` | POST | Generate HTML slides |
| `/api/generate-pdf` | POST | Generate PDF from slides |
| `/api/generate-editable-pptx` | POST | Generate editable PPTX |
| `/api/preview-slides-html` | POST | Preview slides |

### Utilities

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload-logo` | POST | Upload logo file |
| `/api/get-saved-slides` | GET | Get saved slides |
| `/api/history-slides` | GET | Get slides from history |

### Audit

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/scrape-website` | POST | Scrape website |
| `/api/audit-with-visuals` | POST | Audit with screenshots |
| `/api/extract-brand-guidelines` | POST | Extract from PDF |

---

## 🔄 Development Workflow

### Brand Builder Workflow

1. **User Input** → Form fields + logo upload
2. **Progressive Generation** → 7 steps with approval
3. **Save to Database** → Complete guidelines stored
4. **Preview** → HTML-based slide preview
5. **Edit** → Real-time editing in browser
6. **Download** → PDF or PPTX export

### Data Flow

```
User Input
  ↓
Progressive Generator
  ↓
[Generate Step 1: Brand Positioning]
  ↓ User Approves
[Generate Step 2: Logo Guidelines]
  ↓ User Approves
[... continue for all 7 steps]
  ↓
Save to Database
  ↓
HTML Slide Generation
  ↓
Preview & Edit
  ↓
Export (PDF/PPTX)
```

### Working with Slides

**Preview Page:**
- Navigate to `/dashboard/preview-html`
- View all generated slides
- Click "Edit" to enable editing mode
- Edit text, colors, and layout
- Save changes (auto-syncs to database)

**Export Options:**
- **PDF**: `/api/generate-pdf` - Generates multi-page PDF
- **PPTX**: `/api/generate-slides-html` - Generates editable PowerPoint
- **Editable PPTX**: `/api/generate-editable-pptx` - Fully editable elements

---

## 🧪 Testing

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type checking
npm run lint         # Lint code
```

### Database Testing

```bash
npm run db:studio    # Open Drizzle Studio
```

### Docker Commands

```bash
npm run docker:up      # Start all services
npm run docker:down    # Stop all services
npm run docker:logs    # View logs
npm run docker:reset   # Reset volumes and restart
npm run docker:health  # Check service health
```

---

## 🔍 Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` format
- Ensure PostgreSQL is running
- Check database exists

### Email Issues

- Verify SMTP credentials
- Check spam folder
- Test with Gmail app password

### OAuth Issues

- Verify client ID/secret
- Check redirect URIs
- Ensure APIs are enabled

### AI Generation Issues

- Verify `GOOGLE_GEMINI_API` is set
- Check API quota/limits
- Review error logs

---

## 📚 Additional Resources

- **Services Documentation**: `src/lib/services/README.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Main README**: `README.md`

---

## 🚀 Future Enhancements

- Multi-language support
- Collaboration features
- Industry-specific templates
- Advanced editing tools
- Export to additional formats (Figma, Sketch)
- Version history
- Team management

---

This guide covers the essential development information for EternaBrand. For deployment instructions, see `DEPLOYMENT.md`.


