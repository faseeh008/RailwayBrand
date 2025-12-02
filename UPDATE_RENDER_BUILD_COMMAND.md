# 🔧 Update Build Command in Render Dashboard

## The Issue:
Packages are installed but `svelte-kit sync` can't resolve them because of Node.js module resolution timing.

## The Solution:

### Update Build Command in Render:

1. Go to your Render service: `eternabrand-app`
2. Click **Settings**  
3. Find **Build Command**
4. **Change it to:**

```bash
npm install && npm run build
```

### Why This Works:

- `npm install` - Installs all packages (including devDependencies)
- Packages get fully installed and linked
- `npm run build` - Runs `npx vite build` which handles everything
- No manual sync needed - vite build creates `.svelte-kit` automatically

### Current Status:

✅ Prepare hook is disabled (just returns true)
✅ Build script is simplified (just `npx vite build`)
✅ No sync needed - vite handles it

**After updating the build command, save and redeploy!**

