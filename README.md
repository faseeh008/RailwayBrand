# EternaBrand - AI Brand Guideline Assistant

[![CI/CD Pipeline](https://github.com/MuhammadAhmad-BigImmersive/AI-Brand-Guideline-Assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/MuhammadAhmad-BigImmersive/AI-Brand-Guideline-Assistant/actions/workflows/ci.yml)
[![Deployment Status](https://img.shields.io/badge/deployment-vercel-brightgreen)](https://vercel.com)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A SvelteKit prototype for an AI-powered brand guideline assistant that helps startups, freelancers, agencies, and creators build consistent brand experiences.

## Features

### 🎨 Brand Builder

- Generate complete brand guidelines
- Logo creation and guidelines
- Color palette generation
- Typography recommendations
- Tone of voice definition

### 🔍 Brand Audit

- Website compliance checking
- Asset consistency analysis
- Automated fix suggestions
- Before/after previews

### ✨ Creative Generator

- Social media post generation
- Campaign creative creation
- Multi-platform format support
- Brand-consistent designs

## Tech Stack

- **Frontend**: SvelteKit with TypeScript
- **Styling**: TailwindCSS + shadcn-svelte components
- **Icons**: Lucide Svelte
- **Backend**: Drizzle ORM + PostgreSQL, Auth.js
- **AI**: Google Gemini AI for brand guideline generation
- **Color Service**: Python FastAPI microservice for logo analysis

## Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Setup the Color Extraction Service**:

   ```bash
   ./setup-color-service.sh
   ```

   Or manually:
   ```bash
   cd color-service
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   Create a `.env` file with:
   ```
   GOOGLE_GEMINI_API=your-gemini-api-key
   ```

4. **Start the services**:

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

5. **Open your browser**:
   - SvelteKit app: `http://localhost:5173`
   - Color service: `http://localhost:8001`

6. **Build for production**:

   ```bash
   npm run build
   ```

7. **Preview production build**:
   ```bash
   npm run preview
   ```

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

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.**

## Project Structure

```
src/
├── routes/
│   ├── +layout.svelte          # Root layout
│   ├── +page.svelte            # Landing page
│   ├── auth/
│   │   └── +page.svelte        # Authentication page
│   └── dashboard/
│       ├── +layout.svelte      # Dashboard layout with sidebar
│       ├── +page.svelte        # Dashboard home
│       ├── builder/
│       │   └── +page.svelte    # Brand Builder
│       ├── audit/
│       │   └── +page.svelte    # Brand Audit
│       └── creative/
│           └── +page.svelte    # Creative Generator
├── lib/
│   ├── components/ui/          # shadcn-svelte components
│   └── data/
│       └── mock-data.ts        # Mock data for prototype
└── app.css                     # Global styles
```

## Pages Overview

### Landing Page (`/`)

- Hero section with value proposition
- Feature overview cards
- Call-to-action buttons

### Dashboard (`/dashboard`)

- Welcome message and quick stats
- Quick action cards for main features
- Recent activity feed

### Brand Builder (`/dashboard/builder`)

- Form for brand information input
- Mock brand guideline generation
- Export functionality (mocked)

### Brand Audit (`/dashboard/audit`)

- Website URL or file upload input
- Mock audit report with issues and suggestions
- Before/after comparison

### Creative Generator (`/dashboard/creative`)

- Campaign details form
- Platform selection
- Mock creative generation with previews

### Authentication (`/auth`)

- Login/signup forms with social options
- Responsive design
- Form validation (visual only)

## Mock Data

The prototype uses mock data to simulate functionality:

- Sample brand guidelines
- Audit reports with issues and suggestions
- Creative templates and previews
- Industry and audience options

## Future Enhancements

When extending to a full application:

1. **Backend Integration**:
   - Add Drizzle ORM with PostgreSQL
   - Implement real AI processing
   - File upload and storage

2. **Authentication**:
   - Integrate Auth.js
   - User management
   - Session handling

3. **Real Functionality**:
   - AI-powered brand guideline generation
   - Actual website auditing
   - Creative template rendering
   - PDF/file export capabilities

4. **Additional Features**:
   - User dashboard with saved projects
   - Collaboration features
   - Brand asset management
   - Advanced customization options

## Development Notes

- Uses modern SvelteKit with runes mode
- Responsive design with mobile-first approach
- Accessible form controls and navigation
- Clean component architecture for extensibility
- Mock implementations ready for real backend integration

## License

This is a prototype project for demonstration purposes.
