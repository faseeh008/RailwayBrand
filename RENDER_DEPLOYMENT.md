# Render Deployment Guide

This guide will help you deploy the EternaBrand application to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. A GitHub repository with your code
3. All required API keys and environment variables

## Quick Start

### Option 1: Using render.yaml (Recommended)

1. Connect your GitHub repository to Render
2. Render will automatically detect the `render.yaml` file
3. Click "Apply" to create all services defined in the file

### Option 2: Manual Setup

1. Go to your Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: eternabrand
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 22

## Environment Variables

Set the following environment variables in your Render dashboard:

### Required

- `NODE_ENV`: `production`
- `DATABASE_URL`: Your PostgreSQL database connection string (automatically set if using Render's database)
- `GOOGLE_GEMINI_API`: Your Google Gemini API key from https://aistudio.google.com/app/apikey

### Optional

- `OPENAI_API_KEY`: OpenAI API key (if using OpenAI instead of Gemini)
- `AUTH_GOOGLE_ID`: Google OAuth client ID (for Google Slides export)
- `AUTH_GOOGLE_SECRET`: Google OAuth client secret
- `GOOGLE_REFRESH_TOKEN`: Google OAuth refresh token
- `CONVERTAPI_SECRET`: ConvertAPI secret for PDF processing
- `UNSPLASH_APPLICATION_ID`: Unsplash API credentials
- `UNSPLASH_ACCESS_KEY`: Unsplash API credentials
- `UNSPLASH_SECRET_KEY`: Unsplash API credentials
- `PEXELS_API_KEY`: Pexels API key

## Database Setup

1. In Render dashboard, create a new PostgreSQL database
2. The database will automatically be linked if you use the `render.yaml` configuration
3. After deployment, run database migrations:
   ```bash
   npm run db:push
   ```
   Or connect to your database and run the SQL files from the `drizzle/` directory

## Build Configuration

The project is configured with:
- **Adapter**: `@sveltejs/adapter-node` (for Node.js server deployment)
- **Node Version**: 22
- **Build Output**: `build/` directory
- **Start Command**: `npm start` (runs `node build/index.js`)

## Native Dependencies

The following native dependencies are externalized and will be available at runtime:
- `sharp` (image processing)
- `playwright` (browser automation)
- `puppeteer` (browser automation)
- `canvas` (canvas rendering)

These are dynamically imported, so they won't break the build if unavailable.

## Troubleshooting

### Build Fails

1. Check the build logs in Render dashboard
2. Ensure Node version is set to 22
3. Verify all dependencies are in `package.json`

### Sharp Import Error

The `sharp` module is externalized in the build configuration. If you see import errors:
- Ensure `sharp` is in `package.json` dependencies
- The module is dynamically imported, so it should work at runtime

### Database Connection Issues

1. Verify `DATABASE_URL` is set correctly
2. Check that the database is accessible from your web service
3. Ensure database migrations have been run

### Port Configuration

Render automatically sets the `PORT` environment variable. The application listens on `0.0.0.0` and the port specified by Render.

## Post-Deployment

1. **Run Database Migrations**:
   ```bash
   npm run db:push
   ```

2. **Test the Application**:
   - Visit your Render URL
   - Test key functionality
   - Check logs for any errors

3. **Set Up Custom Domain** (Optional):
   - Go to your service settings
   - Add your custom domain
   - Configure DNS as instructed

## Monitoring

- Check build logs for deployment issues
- Monitor application logs for runtime errors
- Set up alerts for service downtime
- Monitor database performance

## Support

For issues specific to:
- **Render**: Check [Render Documentation](https://render.com/docs)
- **SvelteKit**: Check [SvelteKit Documentation](https://kit.svelte.dev/)
- **This Project**: Check the main README.md

