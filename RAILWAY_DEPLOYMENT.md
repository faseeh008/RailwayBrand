# Railway Deployment Guide

This guide will help you deploy the entire EternaBrand project to Railway, including the SvelteKit frontend, Python color-service, and PostgreSQL database.

## 📋 Prerequisites

- GitHub account with this repository
- Railway account (sign up at [railway.app](https://railway.app))
- All environment variables ready (see Environment Variables section)

## 🚀 Quick Deployment Steps

### Step 1: Install Adapter Package

Before deploying, install the required adapter:

```bash
npm install
```

This will install `@sveltejs/adapter-node` which is required for Railway deployment.

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Select your repository: `Faseeh056/RailwayBrandGuideline-`
5. Railway will automatically detect and start deploying

### Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically:
   - Create a PostgreSQL database
   - Set the `DATABASE_URL` environment variable
   - Connect it to your services

**Note:** The database URL will be automatically available to all services in your project.

### Step 4: Configure SvelteKit Service

Railway should auto-detect your Node.js service. Verify the settings:

1. Go to your main service (SvelteKit app)
2. In **Settings**:
   - **Root Directory**: `/` (root)
   - **Build Command**: `npm run build` (auto-detected)
   - **Start Command**: `node build` (auto-detected from Dockerfile)
   - **Port**: Railway sets `PORT` automatically

### Step 5: Add Python Color Service

1. In Railway dashboard, click **"+ New"**
2. Select **"GitHub Repo"** → Select the same repository
3. Configure the service:
   - **Name**: `color-service`
   - **Root Directory**: `color-service`
   - Railway will auto-detect Python and use the Dockerfile

### Step 6: Configure Environment Variables

In Railway dashboard → your project → **Variables**, add all required variables:

#### Required Variables

```bash
# Database (automatically set by Railway PostgreSQL - don't override)
DATABASE_URL=postgresql://... (Railway sets this automatically)

# Authentication
AUTH_SECRET=your-super-secret-key-here-min-32-chars
AUTH_TRUST_HOST=true

# Google Gemini API (Required for AI features)
GOOGLE_GEMINI_API=your-gemini-api-key

# Color Service URL (use Railway service reference)
COLOR_SERVICE_URL=${{color-service.RAILWAY_PUBLIC_DOMAIN}}
# OR manually set after color-service is deployed:
# COLOR_SERVICE_URL=https://your-color-service.railway.app

# Node Environment
NODE_ENV=production

# Ports (Railway sets these automatically, but you can set defaults)
PORT=3000
COLOR_SERVICE_PORT=8001
```

#### Optional Variables

```bash
# Google OAuth (for social login)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Google Cloud (for Vertex AI/Logo generation)
GOOGLE_CLIENT_EMAIL=your-service-account-email
GOOGLE_PRIVATE_KEY=your-private-key
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Image Services
UNSPLASH_ACCESS_KEY=your-unsplash-key
UNSPLASH_API_KEY=your-unsplash-api-key
PEXELS_API_KEY=your-pexels-key

# Email (for password reset/verification)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Public Site URL (your Railway app URL)
PUBLIC_SITE_URL=https://your-app.railway.app
```

### Step 7: Run Database Migrations

After the database is created and connected:

1. Go to your SvelteKit service
2. Open the **Deployments** tab
3. Click on a deployment → **View Logs**
4. Or use Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run db:migrate
```

**Alternative:** Add migration to your deployment script (see below).

### Step 8: Get Service URLs

1. **SvelteKit App URL:**
   - Go to SvelteKit service → **Settings** → **Generate Domain**
   - Copy the public domain (e.g., `https://your-app.railway.app`)

2. **Color Service URL:**
   - Go to color-service → **Settings** → **Generate Domain**
   - Copy the public domain (e.g., `https://color-service.railway.app`)
   - Update `COLOR_SERVICE_URL` environment variable in SvelteKit service

### Step 9: Verify Deployment

1. Check all services are running (green status)
2. Visit your SvelteKit app URL
3. Test the chatbot and logo generation
4. Check logs for any errors:
   - SvelteKit service logs
   - Color service logs
   - Database connection logs

## 🔧 Service Configuration Details

### SvelteKit Service

- **Build Command**: `npm run build`
- **Start Command**: `node build`
- **Port**: Uses `PORT` environment variable (Railway sets automatically)
- **Root Directory**: `/` (project root)

### Color Service

- **Build Command**: Uses Dockerfile
- **Start Command**: `python start.py`
- **Port**: Uses `PORT` or `COLOR_SERVICE_PORT` environment variable
- **Root Directory**: `color-service/`

### PostgreSQL Database

- Automatically managed by Railway
- `DATABASE_URL` is set automatically
- Accessible from all services in the project

## 📝 Environment Variable Setup

### Setting COLOR_SERVICE_URL Dynamically

Railway provides service references. Use this format:

```
COLOR_SERVICE_URL=${{color-service.RAILWAY_PUBLIC_DOMAIN}}
```

Or set manually after both services are deployed:
```
COLOR_SERVICE_URL=https://color-service-production.up.railway.app
```

## 🐛 Troubleshooting

### Build Fails

1. Check build logs in Railway dashboard
2. Verify Node version is 22 (check `package.json`)
3. Ensure all dependencies are in `package.json`
4. Check for missing environment variables

### Database Connection Issues

1. Verify PostgreSQL service is running
2. Check `DATABASE_URL` is set correctly
3. Ensure migrations have run: `railway run npm run db:migrate`
4. Check database logs for connection errors

### Color Service Not Accessible

1. Verify color-service is deployed and running
2. Check color-service logs for errors
3. Verify `COLOR_SERVICE_URL` is set correctly in SvelteKit service
4. Test color-service health endpoint: `https://your-color-service.railway.app/health`

### Port Issues

- Railway automatically sets `PORT` environment variable
- Services should use `process.env.PORT` or `os.getenv("PORT")`
- Don't hardcode port numbers

### Static File Uploads

- Railway provides persistent volumes for file storage
- Files in `static/uploads/` will persist across deployments
- Consider using Railway Volumes for large file storage

## 🚀 Production Optimizations

### 1. Enable Caching

Add to your Railway service settings:
- Enable caching for node_modules
- Enable caching for build artifacts

### 2. Database Connection Pooling

Your current setup uses Drizzle ORM which handles connection pooling. Railway PostgreSQL supports multiple connections.

### 3. Environment Variables

- Use Railway's secret management for sensitive values
- Don't commit `.env` files to Git
- Use Railway Variables UI for easy management

### 4. Monitoring

- Enable Railway Insights for metrics
- Set up alerts for service failures
- Monitor database connection counts

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [SvelteKit Adapter Node](https://kit.svelte.dev/docs/adapter-node)
- [Railway CLI](https://docs.railway.app/develop/cli)

## ✅ Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] SvelteKit service configured
- [ ] Color service added and configured
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Service URLs configured
- [ ] COLOR_SERVICE_URL set correctly
- [ ] All services running (green status)
- [ ] Application tested and working

## 🔄 Updating Deployment

After making code changes:

1. Commit and push to GitHub
2. Railway automatically detects changes
3. Triggers new deployment
4. Services restart with new code

To manually trigger deployment:

```bash
railway up
```

## 💡 Tips

1. **Use Railway CLI** for easier management:
   ```bash
   railway login
   railway link
   railway logs
   railway run npm run db:migrate
   ```

2. **Check Logs Regularly**: Railway provides detailed logs for debugging

3. **Test Locally First**: Always test builds locally before deploying:
   ```bash
   npm run build
   ```

4. **Environment Variables**: Use Railway's variable reference for service URLs

5. **Database Backups**: Railway PostgreSQL includes automatic backups

## 📞 Support

If you encounter issues:

1. Check Railway service logs
2. Verify all environment variables are set
3. Test services individually
4. Check Railway status page for outages
5. Review this deployment guide

---

**Note:** This deployment maintains all existing functionality. The only changes are:
- SvelteKit adapter changed to `adapter-node` (for Railway compatibility)
- Dockerfile updated to use Node 22
- Railway configuration files added
- Color service configured to use Railway PORT variable

All features work exactly as before! 🎉

