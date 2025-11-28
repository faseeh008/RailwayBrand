# Google Slides API Setup Guide

This guide will help you set up Google Slides API integration for exporting brand guidelines presentations.

## Overview

The Google Slides integration allows you to:
- Export brand guidelines as Google Slides presentations
- Use visual templates (no code styling needed!)
- Support all 4 vibes: minimalist, funky, maximalist, default
- Handle dynamic industry-specific slides automatically

## Prerequisites

1. Google Cloud Project
2. Google Slides API enabled
3. OAuth 2.0 credentials

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## Step 2: Enable Google Slides API

1. Go to [API Library](https://console.cloud.google.com/apis/library)
2. Search for "Google Slides API"
3. Click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback/google` (development)
   - `https://yourdomain.com/auth/callback/google` (production)
5. Copy the **Client ID** and **Client Secret**

## Step 4: Get Refresh Token (One-time setup)

You need to get a refresh token for server-side API access:

### Option A: Using OAuth Playground (Easiest)

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In left panel, find "Google Slides API v1"
6. Select scope: `https://www.googleapis.com/auth/presentations`
7. Click "Authorize APIs"
8. Click "Exchange authorization code for tokens"
9. Copy the **Refresh Token**

### Option B: Using Node.js Script

Create a file `get-refresh-token.js`:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:5173/auth/callback/google'
);

const scopes = ['https://www.googleapis.com/auth/presentations'];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes
});

console.log('Visit this URL:', url);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the code from that page here: ', (code) => {
  rl.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    console.log('Refresh Token:', token.refresh_token);
  });
});
```

Run: `node get-refresh-token.js`

## Step 5: Create Google Slides Templates

You need to create 5 templates (one for each vibe + one generic):

### Template Structure

Each template should have:
- **Cover slide** with `{{BRAND_NAME}}` placeholder
- **Fixed slides** for common steps (Brand Intro, Positioning, Logo, Color, Typography, Iconography)
- **Generic dynamic slide** template (for industry-specific steps)

### Placeholders to Use

```
{{BRAND_NAME}}          → Brand name
{{COLOR_1}}             → Primary color (hex)
{{COLOR_2}}             → Secondary color
{{COLOR_3}}             → Accent color
{{PRIMARY_COLOR}}       → Primary color
{{SECONDARY_COLOR}}     → Secondary color
{{ACCENT_COLOR}}        → Accent color
{{MISSION}}             → Mission statement
{{VISION}}              → Vision statement
{{VALUES}}              → Core values (bulleted)
{{TARGET_AUDIENCE}}     → Target audience
{{SLIDE_TITLE}}         → Dynamic slide title (for last 3 steps)
{{SLIDE_CONTENT}}       → Dynamic slide content (for last 3 steps)
```

### Creating Templates

1. **For each vibe** (minimalist, funky, maximalist, default):
   - Create a new Google Slides presentation
   - Design slides visually (fonts, colors, layouts)
   - Add placeholders like `{{BRAND_NAME}}` in text boxes
   - Get the template ID from URL: `https://docs.google.com/presentation/d/TEMPLATE_ID/edit`

2. **Generic Dynamic Template**:
   - Create one flexible template slide
   - Include `{{SLIDE_TITLE}}` and `{{SLIDE_CONTENT}}` placeholders
   - This will be duplicated for the last 3 industry-specific steps

### Example Template Design

**Minimalist Template:**
- Clean, simple layouts
- Serif fonts (Cormorant Garamond)
- Subtle colors
- Top rule + accent circle for headings

**Funky Template:**
- Bold, vibrant designs
- Dynamic layouts
- Bright colors
- Playful typography

**Maximalist Template:**
- Rich, complex layouts
- Multiple visual elements
- Deep colors
- Ornate typography

**Default Template:**
- Professional, balanced
- Standard fonts
- Brand colors
- Clean layouts

## Step 6: Configure Environment Variables

Add to your `.env` file:

```env
# Google OAuth (from Step 3)
AUTH_GOOGLE_ID=your_client_id_here
AUTH_GOOGLE_SECRET=your_client_secret_here
GOOGLE_REFRESH_TOKEN=your_refresh_token_here

# Template IDs (from Step 5)
GOOGLE_SLIDES_TEMPLATE_MINIMALIST=template_id_here
GOOGLE_SLIDES_TEMPLATE_FUNKY=template_id_here
GOOGLE_SLIDES_TEMPLATE_MAXIMALIST=template_id_here
GOOGLE_SLIDES_TEMPLATE_DEFAULT=template_id_here
GOOGLE_SLIDES_TEMPLATE_GENERIC_DYNAMIC=template_id_here
```

## Step 7: Test the Integration

1. Generate brand guidelines in your app
2. Click "Export As" → "Google Slides"
3. Check that:
   - Presentation is created in Google Drive
   - All placeholders are replaced
   - Dynamic slides are populated correctly
   - Styling matches the vibe

## Troubleshooting

### "Authentication required" error
- Check that OAuth credentials are correct
- Verify refresh token is valid
- Re-run OAuth flow if needed

### "Template not found" error
- Verify template IDs in `.env` are correct
- Check that templates are accessible (not deleted)
- Ensure templates are in your Google Drive

### Placeholders not replaced
- Check placeholder spelling (case-sensitive)
- Verify placeholders are in text boxes (not images)
- Ensure placeholders match exactly: `{{BRAND_NAME}}`

### Dynamic slides not working
- Verify `GOOGLE_SLIDES_TEMPLATE_GENERIC_DYNAMIC` is set
- Check that template has `{{SLIDE_TITLE}}` and `{{SLIDE_CONTENT}}` placeholders

## Best Practices

1. **Template Design:**
   - Use consistent fonts and colors per vibe
   - Keep placeholders in separate text boxes
   - Test with sample data before deploying

2. **Placeholder Naming:**
   - Use uppercase with underscores: `{{BRAND_NAME}}`
   - Be descriptive: `{{PRIMARY_COLOR}}` not `{{COLOR1}}`
   - Document all placeholders in template

3. **Dynamic Slides:**
   - Keep generic template simple and flexible
   - Use bullet points for lists
   - Allow for variable content length

## API Rate Limits

- **Free tier:** 100 requests/day
- **Paid tier:** Higher limits available
- Consider caching presentations to reduce API calls

## Next Steps

1. Create all 5 templates
2. Configure environment variables
3. Test with sample brand data
4. Share templates with your team for updates

## Support

If you encounter issues:
1. Check Google Cloud Console for API errors
2. Review server logs for detailed error messages
3. Verify all environment variables are set correctly

