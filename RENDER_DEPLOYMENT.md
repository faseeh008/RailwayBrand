# Render Deployment Guide

This guide will help you deploy the entire EternaBrand project to Render, including the SvelteKit frontend, Python color-service, and PostgreSQL database.

## 📋 Prerequisites

- GitHub account with this repository
- Render account (sign up at [render.com](https://render.com) - **FREE tier available!**)
- All environment variables ready (see Environment Variables section)

## 🚀 Quick Deployment Steps

### Step 1: Create Render Account

1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub account
3. **Free tier includes:**
   - 750 hours/month of free web services
   - Free PostgreSQL database
   - Automatic deployments from GitHub

### Step 2: Create PostgreSQL Database

1. In Render dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Configure:
   - **Name**: `eternabrand-db`
   - **Database**: `eternabrand`
   - **User**: `eternabrand_user`
   - **Plan**: Free (or Hobby for production)
4. Click **"Create Database"**
5. Note the **Internal Database URL** (you'll need this)

### Step 3: Deploy SvelteKit Application

1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your GitHub repository: `faseeh008/RailwayBrand`
4. Configure the service:
   - **Name**: `eternabrand-app`
   - **Environment**: **Node**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node build`
   - **Plan**: Free

### Step 4: Configure Environment Variables (SvelteKit)

In your SvelteKit service → **Environment**, add:

```bash
# Database (use Internal Database URL from PostgreSQL service)
DATABASE_URL=<copy-from-postgres-service-internal-url>

# Authentication
AUTH_SECRET=your-super-secret-key-min-32-chars-generate-random
AUTH_TRUST_HOST=true

# Google Gemini API (Required for AI features)
GOOGLE_GEMINI_API=your-gemini-api-key

# Node Environment
NODE_ENV=production

# Port (Render sets this automatically)
PORT=10000
```

**To get DATABASE_URL:**
1. Go to PostgreSQL service
2. Copy **"Internal Database URL"** (not public URL)
3. Paste into `DATABASE_URL` variable

### Step 5: Deploy Python Color Service

1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect the same GitHub repository
4. Configure:
   - **Name**: `color-service`
   - **Environment**: **Docker**
   - **Dockerfile Path**: `color-service/Dockerfile`
   - **Docker Context**: `color-service`
   - **Build Command**: (leave empty, Dockerfile handles it)
   - **Start Command**: (leave empty, Dockerfile handles it)
   - **Plan**: Free

### Step 6: Configure Environment Variables (Color Service)

In color-service → **Environment**, add:

```bash
# Google Gemini API (for color extraction)
GOOGLE_GEMINI_API=your-gemini-api-key

# Port (Render sets automatically, but you can set default)
PORT=10000
COLOR_SERVICE_PORT=10000
```

### Step 7: Update COLOR_SERVICE_URL

1. After color-service is deployed, go to color-service dashboard
2. Copy the **Service URL** (e.g., `https://color-service.onrender.com`)
3. Go to SvelteKit service → **Environment**
4. Add or update:
   ```bash
   COLOR_SERVICE_URL=https://color-service.onrender.com
   ```

### Step 8: Run Database Migrations

After database is created:

1. Go to SvelteKit service → **Shell** tab
2. Or use Render CLI:

```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# Run migrations
render run npm run db:migrate
```

**Or manually via Shell:**
```bash
# In Render dashboard → SvelteKit service → Shell
npm run db:migrate
```

### Step 9: Trigger Deployment

1. Render automatically deploys on git push
2. Or manually trigger: Service → **Manual Deploy** → **Deploy latest commit**

### Step 10: Get Your URLs

1. **SvelteKit App**: Service → **Settings** → Copy service URL
2. **Color Service**: Service → **Settings** → Copy service URL
3. Update `COLOR_SERVICE_URL` if needed

## 🔧 Advanced Configuration

### Using render.yaml (Blueprint)

For easier setup, you can use the `render.yaml` file:

1. In Render dashboard, click **"New +"**
2. Select **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and set up all services automatically

**Note:** You'll still need to manually set:
- `GOOGLE_GEMINI_API` in both services
- `AUTH_SECRET` in SvelteKit service
- `COLOR_SERVICE_URL` after color-service is deployed

### Environment Variable Setup

#### Required Variables for SvelteKit

```bash
DATABASE_URL=postgresql://user:pass@host:port/dbname
AUTH_SECRET=min-32-character-random-string
AUTH_TRUST_HOST=true
GOOGLE_GEMINI_API=your-gemini-api-key
COLOR_SERVICE_URL=https://color-service.onrender.com
NODE_ENV=production
```

#### Optional Variables

```bash
# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Google Cloud (for Vertex AI)
GOOGLE_CLIENT_EMAIL=your-service-account-email
GOOGLE_PRIVATE_KEY=your-private-key
GOOGLE_PROJECT_ID=your-project-id

# Image Services
UNSPLASH_ACCESS_KEY=your-key
PEXELS_API_KEY=your-key

# Email
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Public URL
PUBLIC_SITE_URL=https://your-app.onrender.com
```

## 📝 Service Configuration Details

### SvelteKit Service

- **Build Command**: `npm install && npm run build`
- **Start Command**: `node build`
- **Port**: Uses `PORT` environment variable (Render sets automatically)
- **Node Version**: 22 (specified in package.json)

### Color Service

- **Build**: Uses Dockerfile
- **Start**: Uses Dockerfile CMD
- **Port**: Uses `PORT` or `COLOR_SERVICE_PORT` environment variable
- **Python Version**: 3.11 (in Dockerfile)

### PostgreSQL Database

- Automatically managed by Render
- Use **Internal Database URL** for `DATABASE_URL`
- Free tier includes 90 days of backups

## 🐛 Troubleshooting

### Build Fails

1. Check build logs in Render dashboard
2. Verify Node version is 22 (check `package.json`)
3. Ensure all dependencies are in `package.json`
4. Check for missing environment variables

### Database Connection Issues

1. Verify PostgreSQL service is running
2. Use **Internal Database URL** (not public URL)
3. Ensure migrations have run
4. Check database logs for connection errors

### Color Service Not Accessible

1. Verify color-service is deployed and running
2. Check color-service logs for errors
3. Verify `COLOR_SERVICE_URL` is set correctly in SvelteKit
4. Test color-service health endpoint: `https://color-service.onrender.com/health`

### Service Goes to Sleep (Free Tier)

Render's free tier services sleep after 15 minutes of inactivity:
- First request after sleep takes ~30 seconds (cold start)
- Consider upgrading to Hobby plan ($7/month) for always-on services
- Or use a ping service to keep services awake

### Port Issues

- Render automatically sets `PORT` environment variable
- Services should use `process.env.PORT` or `os.getenv("PORT")`
- Default port is usually 10000 on Render

### Static File Uploads

- Render provides persistent disk storage
- Files in `static/uploads/` will persist
- Consider using external storage (S3) for production

## 💰 Pricing

### Free Tier Includes:

- **Web Services**: 750 hours/month (enough for 1 service running 24/7)
- **PostgreSQL**: 90 days of backups
- **Bandwidth**: 100 GB/month
- **Limitation**: Services sleep after 15 min inactivity

### Hobby Plan ($7/month):

- Always-on services (no sleeping)
- More resources
- Better for production

## 🚀 Production Optimizations

### 1. Enable Auto-Deploy

- Services automatically deploy on git push
- Configure branch (default: `main`)

### 2. Health Checks

- Render automatically checks service health
- Configure health check path if needed

### 3. Environment Variables

- Use Render's environment variable UI
- Keep secrets secure
- Use environment-specific values

### 4. Monitoring

- Check service logs regularly
- Monitor metrics in Render dashboard
- Set up alerts for service failures

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [SvelteKit Adapter Node](https://kit.svelte.dev/docs/adapter-node)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)

## ✅ Deployment Checklist

- [ ] Render account created
- [ ] GitHub repository connected
- [ ] PostgreSQL database created
- [ ] SvelteKit service deployed
- [ ] Color service deployed
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Service URLs configured
- [ ] COLOR_SERVICE_URL set correctly
- [ ] All services running (green status)
- [ ] Application tested and working

## 🔄 Updating Deployment

After making code changes:

1. Commit and push to GitHub
2. Render automatically detects changes
3. Triggers new deployment
4. Services restart with new code

## 💡 Tips

1. **Use Internal Database URL**: Always use the internal URL for database connections
2. **Set AUTH_SECRET**: Generate a strong random secret (minimum 32 characters)
3. **Monitor Logs**: Check Render logs for debugging
4. **Test Locally First**: Always test builds locally before deploying
5. **Keep Services Awake**: Use a ping service or upgrade to prevent sleeping

## 🆘 Support

If you encounter issues:

1. Check Render service logs
2. Verify all environment variables are set
3. Test services individually
4. Check Render status page for outages
5. Review this deployment guide

---

**Note:** Render's free tier is perfect for development and testing. For production, consider upgrading to the Hobby plan for always-on services and better performance.

