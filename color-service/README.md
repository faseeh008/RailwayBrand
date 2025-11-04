# Color & Typography Extraction Service

A Python microservice that extracts colors and typography recommendations from logos using AI analysis.

## Features

- **Color Extraction**: Extracts dominant colors from logos using ColorThief
- **AI Color Classification**: Uses Google Gemini AI to organize colors into professional brand systems
- **Typography Analysis**: Analyzes logo typography and suggests appropriate fonts
- **FastAPI Integration**: RESTful API for easy integration with SvelteKit

## API Endpoints

### POST `/extract-colors`
Extract colors from uploaded logo and generate brand color system.

**Parameters:**
- `file`: Logo image file (multipart/form-data)
- `color_count`: Number of colors to extract (default: 5)
- `api_key`: Google Gemini API key

**Response:**
```json
{
  "success": true,
  "extracted_palette": {
    "colors": [
      {
        "name": "Vibrant Teal",
        "hex": "#04dbac",
        "rgb": [4, 219, 172],
        "cmyk": [98, 0, 21, 14]
      }
    ]
  },
  "brand_color_system": {
    "primary": [...],
    "secondary": [...],
    "neutrals": [...],
    "background": [...]
  }
}
```

### POST `/extract-typography`
Extract typography recommendations from uploaded logo.

**Parameters:**
- `file`: Logo image file (multipart/form-data)
- `brand_name`: Brand name
- `brand_domain`: Industry domain
- `short_description`: Brand description
- `mood`: Brand mood
- `audience`: Target audience
- `api_key`: Google Gemini API key

**Response:**
```json
{
  "success": true,
  "typography": {
    "primary_font": {
      "name": "Montserrat",
      "reasoning": "Modern sans-serif that matches logo style",
      "usage": "Headings and key messaging"
    },
    "supporting_font": {
      "name": "Open Sans",
      "reasoning": "Readable complement to primary font",
      "usage": "Body text and UI elements"
    },
    "hierarchy": {
      "headings": "24px-48px, Bold",
      "body": "16px-18px, Regular",
      "captions": "12px-14px, Medium"
    },
    "guidelines": [
      "Use primary font for all headings",
      "Maintain consistent spacing",
      "Ensure good contrast ratios"
    ]
  }
}
```

### GET `/health`
Health check endpoint.

## Setup

### Option 1: Using the Setup Script
```bash
./setup-color-service.sh
```

### Option 2: Manual Setup

1. **Install Python 3.11+**

2. **Create virtual environment:**
```bash
cd color-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set environment variables:**
```bash
export GOOGLE_GEMINI_API="your-api-key-here"
```

5. **Start the service:**
```bash
python start.py
```

### Option 3: Using Docker

```bash
docker-compose up color-service
```

## Environment Variables

- `GOOGLE_GEMINI_API`: Your Google Gemini API key (required)
- `COLOR_SERVICE_PORT`: Port to run the service on (default: 8001)

## Integration with SvelteKit

The service is automatically integrated with the SvelteKit application through:

1. **Color Extraction Service**: `src/lib/services/color-extraction.ts`
2. **Progressive Generation**: Updated to use extracted colors/typography
3. **API Integration**: Calls microservice during color-palette and typography steps

## How It Works

### Color Extraction Process:
1. **Upload**: Logo image is uploaded to the service
2. **ColorThief**: Extracts dominant colors using ColorThief library
3. **AI Analysis**: Google Gemini analyzes the colors and logo image
4. **Classification**: Colors are organized into primary, secondary, neutrals, and background
5. **Response**: Structured color system is returned

### Typography Analysis Process:
1. **Upload**: Logo image is uploaded with brand context
2. **AI Vision**: Google Gemini analyzes the logo's typography style
3. **Recommendations**: AI suggests appropriate fonts and hierarchy
4. **Guidelines**: Typography usage rules are generated
5. **Response**: Complete typography system is returned

## Dependencies

- **FastAPI**: Web framework
- **ColorThief**: Color extraction from images
- **Google Generative AI**: AI analysis and recommendations
- **WebColors**: Color name mapping
- **Pillow**: Image processing
- **Uvicorn**: ASGI server

## Troubleshooting

### Common Issues:

1. **"API key not configured"**
   - Set the `GOOGLE_GEMINI_API` environment variable

2. **"Color extraction failed"**
   - Ensure the uploaded file is a valid image
   - Check that ColorThief can process the image format

3. **"Service not responding"**
   - Check if the service is running on port 8001
   - Verify CORS settings for your SvelteKit app

4. **"Failed to parse JSON"**
   - The AI response may not be properly formatted
   - Check the Google Gemini API key and quota

### Logs:
Check the console output for detailed error messages and API responses.

## Development

To run in development mode with auto-reload:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

## Production Deployment

For production deployment, use a proper ASGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```
