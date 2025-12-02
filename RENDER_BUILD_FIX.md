# 🔧 Render Build Command Fix

## The Problem
Render is using: `npm ci && npm run build`

But this fails because:
1. `npm ci` runs the `prepare` hook automatically
2. `prepare` hook tries to run `svelte-kit sync` 
3. Packages aren't fully resolved yet, so sync fails
4. Build then fails

## The Solution

### Update Build Command in Render Dashboard:

1. Go to your Render service: `eternabrand-app`
2. Click **Settings**
3. Find **Build Command**
4. Replace it with:

```bash
npm ci --ignore-scripts && npx svelte-kit sync && npx vite build
```

### Why This Works:

- `--ignore-scripts` - Skips prepare/postinstall hooks during install
- Packages get installed fully
- `npx svelte-kit sync` - Runs manually after packages are installed
- `npx vite build` - Builds the app

## Alternative (Simpler):

If the above doesn't work, try:

```bash
npm install --ignore-scripts && npx svelte-kit sync && npx vite build
```

## After Updating:

1. Save the settings
2. Click "Manual Deploy" → "Deploy latest commit"
3. Watch the logs - it should work now!

