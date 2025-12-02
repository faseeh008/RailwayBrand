# 🚂 Railway Quick Start Guide

Get your EternaBrand application deployed on Railway in 5 minutes!

## ⚡ Quick Deploy

### 1. Install Dependencies

```bash
npm install
```

### 2. Push to GitHub

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 3. Deploy on Railway

1. Go to [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → Select your repo
3. Railway auto-detects and starts deploying

### 4. Add Services

In Railway dashboard, add these services:

#### A. Add PostgreSQL Database
- Click **"+ New"** → **Database** → **Add PostgreSQL**
- Railway sets `DATABASE_URL` automatically ✅

#### B. Add Color Service
- Click **"+ New"** → **GitHub Repo** → Same repo
- Set **Root Directory** to: `color-service`
- Railway auto-detects Python ✅

### 5. Set Environment Variables

In Railway → **Variables**, add:

```bash
# Required
AUTH_SECRET=your-super-secret-key-min-32-chars
AUTH_TRUST_HOST=true
GOOGLE_GEMINI_API=your-gemini-api-key

# Color Service URL (set after color-service is deployed)
COLOR_SERVICE_URL=${{color-service.RAILWAY_PUBLIC_DOMAIN}}
```

### 6. Run Migrations

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link
railway login
railway link

# Run migrations
railway run npm run db:migrate
```

### 7. Get Your URLs

1. SvelteKit service → **Settings** → **Generate Domain**
2. Color service → **Settings** → **Generate Domain**
3. Update `COLOR_SERVICE_URL` with color service URL

### 8. Done! 🎉

Visit your SvelteKit app URL and start building brands!

## 📚 Full Guide

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

## 🆘 Need Help?

- Check service logs in Railway dashboard
- Verify all environment variables are set
- Ensure database migrations have run
- See troubleshooting section in full guide

---

**What Changed?**
- ✅ SvelteKit adapter updated to `adapter-node`
- ✅ Dockerfile updated for Node 22
- ✅ Railway config files added
- ✅ All functionality preserved - nothing broken!

