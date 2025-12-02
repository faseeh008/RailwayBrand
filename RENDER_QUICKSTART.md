# 🚀 Render Quick Start Guide

Get your EternaBrand application deployed on Render in 10 minutes - **100% FREE!**

## ⚡ Quick Deploy

### 1. Create Render Account

1. Go to [render.com](https://render.com) → **Sign Up** (FREE!)
2. Connect your GitHub account
3. Free tier includes 750 hours/month

### 2. Create PostgreSQL Database

1. In Render dashboard → **"New +"** → **PostgreSQL**
2. Configure:
   - **Name**: `eternabrand-db`
   - **Plan**: Free
3. Click **"Create Database"**
4. **Copy Internal Database URL** (you'll need this!)

### 3. Deploy SvelteKit App

1. **"New +"** → **Web Service** → Connect GitHub repo
2. Select: `faseeh008/RailwayBrand`
3. Configure:
   - **Name**: `eternabrand-app`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node build`
   - **Plan**: Free

### 4. Set Environment Variables (SvelteKit)

In service → **Environment**, add:

```bash
DATABASE_URL=<paste-internal-database-url-from-postgres>
AUTH_SECRET=your-32-char-random-secret-key
AUTH_TRUST_HOST=true
GOOGLE_GEMINI_API=your-gemini-api-key
NODE_ENV=production
```

### 5. Deploy Color Service

1. **"New +"** → **Web Service** → Same GitHub repo
2. Configure:
   - **Name**: `color-service`
   - **Environment**: Docker
   - **Dockerfile Path**: `color-service/Dockerfile`
   - **Docker Context**: `color-service`
   - **Plan**: Free

### 6. Set Environment Variables (Color Service)

```bash
GOOGLE_GEMINI_API=your-gemini-api-key
```

### 7. Update COLOR_SERVICE_URL

1. After color-service deploys, copy its URL
2. In SvelteKit service → Environment:
   ```bash
   COLOR_SERVICE_URL=https://color-service.onrender.com
   ```

### 8. Run Migrations

In SvelteKit service → **Shell**:

```bash
npm run db:migrate
```

### 9. Done! 🎉

Visit your SvelteKit app URL and start building brands!

## 📚 Full Guide

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed instructions.

## 🆘 Need Help?

- Check service logs in Render dashboard
- Verify all environment variables are set
- Ensure database migrations have run
- See troubleshooting section in full guide

## 💡 Free Tier Notes

- Services sleep after 15 min of inactivity (first request takes ~30 sec)
- 750 hours/month = enough for 1 service running 24/7
- Upgrade to Hobby ($7/month) for always-on services

---

**What Changed?**
- ✅ Removed Railway configurations
- ✅ Added Render configurations
- ✅ All functionality preserved - nothing broken!

