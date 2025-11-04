# Font Detection Setup

## Overview
The color service now includes optional font detection using an ONNX model to identify exact fonts from logo images.

## Requirements

### 1. Model Files
You need to add two files to the `color-service` directory:

- `model.onnx` - The ONNX font detection model
- `model_config.yaml` - Configuration file with font labels

### 2. Model Config Format (`model_config.yaml`)
```yaml
classes: 1000  # Number of font classes
size: 320      # Input image size
classnames:
  - "Arial"
  - "Helvetica"
  - "Times New Roman"
  - "Roboto"
  # ... (list all your font names)
```

### 3. System Dependencies

#### For Docker:
The Dockerfile needs to be updated to install Tesseract OCR:
```dockerfile
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*
```

#### For Local Development:
Install Tesseract OCR:
- **Ubuntu/Debian**: `sudo apt-get install tesseract-ocr`
- **macOS**: `brew install tesseract`
- **Windows**: Download from https://github.com/UB-Mannheim/tesseract/wiki

## How It Works

1. **OCR Detection**: Uses Tesseract to detect if text exists in the logo
2. **Font Recognition**: If text is found, crops each text region and runs it through the ONNX model
3. **Fallback**: If no text is detected or model files are missing, returns `None` and the AI will suggest fonts based on brand context

## API Endpoint

### POST `/detect-font`

**Request:**
```bash
curl -X POST http://localhost:8001/detect-font \
  -F "file=@logo.png" \
  -F "api_key=YOUR_API_KEY"
```

**Response (with detected font):**
```json
{
  "success": true,
  "detected_font": "Montserrat",
  "has_text": true,
  "message": "Font detected from logo"
}
```

**Response (no text detected):**
```json
{
  "success": true,
  "detected_font": null,
  "has_text": false,
  "message": "No text detected in logo"
}
```

## Integration with Typography Analysis

The font detection integrates with the existing `/extract-typography` endpoint:

1. First, call `/detect-font` to get the exact font name (if available)
2. Then, call `/extract-typography` with the detected font information
3. The AI will use the detected font as a foundation or suggest fonts based on brand context if no font was detected

## Optional Setup

The font detection is **completely optional**. The service will work without the model files:

- If `model.onnx` and `model_config.yaml` are not present, font detection is disabled
- If dependencies are not installed, font detection is disabled
- The service will log warnings but continue to work normally
- Typography analysis will fall back to AI-only suggestions

## Health Check

Check if font detection is available:
```bash
curl http://localhost:8001/health
```

Response:
```json
{
  "status": "healthy",
  "service": "color-typography-extraction",
  "font_detection_available": true
}
```

## Troubleshooting

### Font detection not working?
1. Check if `model.onnx` and `model_config.yaml` exist in the color-service directory
2. Check if Tesseract is installed: `tesseract --version`
3. Check the service logs for any error messages
4. Verify the health endpoint shows `font_detection_available: true`

### Missing dependencies?
```bash
cd color-service
pip install -r requirements.txt
```

### Docker build failing?
Make sure the Dockerfile includes Tesseract installation (see above)


