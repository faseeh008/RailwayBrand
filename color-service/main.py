import os
import json
import re
import base64
from io import BytesIO
from typing import Union, List, Dict, Any, Optional
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from colorthief import ColorThief
import webcolors
import google.generativeai as genai

# Font detection imports
try:
    import yaml
    import numpy as np
    import pytesseract
    from PIL import Image as PILImage
    import torchvision.transforms as T
    
    # Try importing onnxruntime with error handling for executable stack issue
    try:
        import onnxruntime as ort
        print("✅ ONNX Runtime loaded successfully!")
    except Exception as ort_error:
        print(f"⚠️ ONNX Runtime import error: {ort_error}")
        # Try setting environment variable to ignore the error
        import os as os_module
        os_module.environ['ORT_DISABLE_EXECUTABLE_CHECK'] = '1'
        import onnxruntime as ort
        print("✅ ONNX Runtime loaded with workaround!")
    
    FONT_DETECTION_AVAILABLE = True
    print("✅ Font detection dependencies loaded successfully!")
except ImportError as e:
    FONT_DETECTION_AVAILABLE = False
    print(f"❌ Font detection dependencies not available: {e}")
    print("Font detection will be disabled.")
except Exception as e:
    FONT_DETECTION_AVAILABLE = False
    print(f"❌ Font detection initialization failed: {e}")
    print("Font detection will be disabled.")

# ============================================================
# FastAPI App Setup
# ============================================================

app = FastAPI(
    title="Brand Color & Typography Extraction Service",
    description="Extract colors and typography from logos using AI",
    version="1.0.0"
)

# CORS middleware for SvelteKit integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Add your SvelteKit dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Utility Functions (from your original code)
# ============================================================

def _to_hex(rgb: tuple) -> str:
    """Convert RGB tuple to HEX string."""
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def _to_cmyk(rgb: tuple) -> tuple:
    """Convert RGB -> CMYK (percent values)."""
    r, g, b = [x / 255.0 for x in rgb]
    k = 1 - max(r, g, b)
    if k == 1:
        return (0, 0, 0, 100)
    c = (1 - r - k) / (1 - k)
    m = (1 - g - k) / (1 - k)
    y = (1 - b - k) / (1 - k)
    return (round(c * 100), round(m * 100), round(y * 100), round(k * 100))


def _get_color_name(hex_code: str) -> str:
    """Return closest CSS3 color name to the given HEX code."""
    try:
        # Exact name if available
        return webcolors.hex_to_name(hex_code, spec="css3")
    except ValueError:
        pass

    # Fallback: find closest by Euclidean distance
    try:
        all_names = webcolors.names("css3")  # new API (>=24.x)
        all_hex = [webcolors.name_to_hex(n, spec="css3") for n in all_names]
    except Exception:
        # fallback for old versions (<24.x)
        from webcolors import CSS3_NAMES_TO_HEX
        all_names = list(CSS3_NAMES_TO_HEX.keys())
        all_hex = list(CSS3_NAMES_TO_HEX.values())

    target_rgb = webcolors.hex_to_rgb(hex_code)
    min_distance = float("inf")
    closest_name = None

    for name, code in zip(all_names, all_hex):
        r_c, g_c, b_c = webcolors.hex_to_rgb(code)
        distance = (r_c - target_rgb.red) ** 2 + (g_c - target_rgb.green) ** 2 + (b_c - target_rgb.blue) ** 2
        if distance < min_distance:
            min_distance = distance
            closest_name = name

    return closest_name or "Unnamed Color"


# ============================================================
# Color Extraction Functions
# ============================================================

def extract_colors_from_bytes(image_bytes: bytes, color_count: int = 7) -> Dict[str, Any]:
    """
    Extract dominant colors from image bytes.
    Returns HEX, RGB, CMYK, Name.
    """
    try:
        fp = BytesIO(image_bytes)
        ct = ColorThief(fp)
        palette: List[tuple] = ct.get_palette(color_count=color_count)

        colors = []
        for rgb in palette:
            hex_code = _to_hex(rgb)
            colors.append({
                "name": _get_color_name(hex_code),
                "hex": hex_code,
                "rgb": list(rgb),
                "cmyk": list(_to_cmyk(rgb))
            })
        return {"colors": colors}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Color extraction failed: {str(e)}")


# ============================================================
# AI Prompts
# ============================================================

brand_color_prompt = """
You are a brand design assistant. Your task is to organize a given logo color palette into a professional brand color system.

Rules:
1. Input includes extracted colors with name, hex, rgb, cmyk. Use these values as the basis.
2. Your categories are:
   - "primary": 1–2 main, logo-defining colors.
   - "secondary": supportive accent colors.
   - "neutrals": grayscale or muted tones for typography/UI.
   - "background": light or dark fills for backgrounds.
3. If the logo has more than 2 strong colors:
   - Classify only from the extracted palette.
4. If the logo has only 2 major colors:
   - Put both into "primary".
   - For "secondary", "neutrals", and "background", you may suggest additional complementary colors not present in the extracted palette. In this case, you must still output objects with proper fields (name, hex, rgb, cmyk).
5. Always return JSON only, no commentary.
6. Some colors have two names so write them both

Example when logo has 2 colors:
{
  "primary": [
    {
      "name": "Vibrant Teal or MediumSpringGreen",
      "hex": "#1f4f82",
      "rgb": [31, 79, 130],
      "cmyk": [76, 39, 0, 49]
    },
    {
      "name": "Charcoal or darkslategray",
      "hex": "#f97316",
      "rgb": [249, 115, 22],
      "cmyk": [0, 54, 91, 2]
    }
  ],
  "secondary": [
    {
      "name": "Emerald Green",
      "hex": "#10b981",
      "rgb": [16, 185, 129],
      "cmyk": [91, 0, 30, 27]
    }
  ],
  "neutrals": [
    {
      "name": "Cool Gray",
      "hex": "#94a3b8",
      "rgb": [148, 163, 184],
      "cmyk": [20, 11, 0, 28]
    }
  ],
  "background": [
    {
      "name": "White",
      "hex": "#ffffff",
      "rgb": [255, 255, 255],
      "cmyk": [0, 0, 0, 0]
    }
  ]
}
"""

def get_typography_prompt(detected_font: Optional[str] = None) -> str:
    """Generate typography prompt based on whether font was detected."""
    
    if detected_font:
        return f"""
🚨 CRITICAL INSTRUCTION - MANDATORY REQUIREMENT 🚨

A font detection model has IDENTIFIED the EXACT font in the brand's logo: "{detected_font}"

YOUR ONLY TASK:
1. You MUST use "{detected_font}" as the primary_font.name - NO EXCEPTIONS
2. Suggest ONLY a complementary supporting font
3. DO NOT suggest any other primary font
4. DO NOT change or substitute "{detected_font}" with any other font

MANDATORY JSON RESPONSE FORMAT:
{{
  "primary_font": {{
    "name": "{detected_font}",
    "reasoning": "This exact font was detected from the brand's logo using AI-powered font recognition. Using this font ensures perfect consistency with the brand's visual identity.",
    "usage": "Use for all headings, key brand messaging, and any UI elements that should match the logo. This maintains brand consistency across all touchpoints."
  }},
  "supporting_font": {{
    "name": "[Choose ONE complementary font that pairs well with {detected_font}]",
    "reasoning": "[Explain why this specific font complements {detected_font}]",
    "usage": "Body text, paragraphs, and supporting content"
  }},
  "hierarchy": {{
    "headings": "{detected_font} Bold/ExtraBold, 24-48px",
    "body": "[Supporting font] Regular, 16-18px",
    "captions": "[Supporting font] Regular, 12-14px"
  }},
  "guidelines": [
    "ALWAYS use {detected_font} for brand-critical text to maintain consistency with the logo",
    "Pair {detected_font} with the supporting font for optimal readability",
    "Maintain consistent font weights across all platforms"
  ]
}}

🚨 CRITICAL VALIDATION 🚨
- primary_font.name MUST EXACTLY equal "{detected_font}"
- DO NOT use quotes, parentheses, or any modifications to the font name
- If you return ANY other font name for primary_font, you have FAILED this task

Return ONLY the JSON object, no additional text.
"""
    else:
        return """
You are a typography expert. Analyze the logo image and suggest appropriate typography for this brand.
NOTE: No text was detected in the logo, so suggest fonts based on the logo's visual style, industry, and brand personality.

Based on the logo's style, suggest:
1. Primary font (for headings)
2. Supporting font (for body text)
3. Font hierarchy and usage guidelines

Consider:
- The logo's visual style (modern, classic, playful, professional)
- Industry context
- Brand personality
- Colors and shapes in the logo

Return JSON format:
{
  "primary_font": {
    "name": "Exact Font Name",
    "reasoning": "Why this font matches the logo's visual style",
    "usage": "Best use cases"
  },
  "supporting_font": {
    "name": "Exact Font Name", 
    "reasoning": "Why this font complements the primary",
    "usage": "Best use cases"
  },
  "hierarchy": {
    "headings": "Font size and weight guidelines",
    "body": "Font size and weight guidelines",
    "captions": "Font size and weight guidelines"
  },
  "guidelines": [
    "Typography rule 1",
    "Typography rule 2",
    "Typography rule 3"
  ]
}

Use only well-known, professional fonts like: Inter, Roboto, Montserrat, Poppins, Open Sans, Lato, Helvetica, Arial, Georgia, Times New Roman, Playfair Display, Source Sans Pro, Bayon, etc.
"""


# ============================================================
# AI Generation Functions
# ============================================================

def generate_brand_colors(image_bytes: bytes, palette: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """Generate professional brand color system using Gemini AI."""
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')

        # Convert image bytes to PIL Image
        from PIL import Image
        import io
        image = Image.open(io.BytesIO(image_bytes))
        
        # Prepare the prompt and image
        prompt_text = f"{brand_color_prompt}\n\nHere is the extracted ColorThief palette:\n{json.dumps(palette, indent=2)}"
        
        # Generate content with image
        response = model.generate_content([prompt_text, image])
        
        # Parse JSON
        raw = response.text.strip()
        fenced_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw, re.IGNORECASE)
        cleaned = fenced_match.group(1).strip() if fenced_match else raw

        try:
            parsed = json.loads(cleaned)
        except Exception:
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1 and end > start:
                candidate = cleaned[start:end + 1]
                try:
                    parsed = json.loads(candidate)
                except Exception:
                    return {"error": "Failed to parse JSON", "raw": raw}
            else:
                return {"error": "No JSON object found", "raw": raw}

        return {
            "primary": parsed.get("primary", []),
            "secondary": parsed.get("secondary", []),
            "neutrals": parsed.get("neutrals", []),
            "background": parsed.get("background", [])
        }
    except Exception as e:
        return {"error": f"AI generation failed: {str(e)}"}


def generate_typography_from_logo(image_bytes: bytes, brand_info: Dict[str, str], api_key: str, detected_font: Optional[str] = None) -> Dict[str, Any]:
    """Generate typography recommendations from logo using Gemini AI."""
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')

        # Convert image bytes to PIL Image
        from PIL import Image
        import io
        image = Image.open(io.BytesIO(image_bytes))
        
        brand_context = f"""
Brand: {brand_info.get('brand_name', 'Your Brand')}
Domain: {brand_info.get('brand_domain', 'General Business')}
Description: {brand_info.get('short_description', 'Professional brand')}
Mood: {brand_info.get('mood', 'Professional')}
Target Audience: {brand_info.get('audience', 'General audience')}
{f'Detected Font in Logo: {detected_font}' if detected_font else 'No text detected in logo'}
"""
        
        print(f"Brand context: {brand_context}")
        # Get the appropriate prompt based on whether font was detected
        typography_prompt = get_typography_prompt(detected_font)

        print(f"Typography prompt: {typography_prompt}")

        # Prepare the prompt and image  
        prompt_text = f"{brand_context}\n\n{typography_prompt}"
        
        # Generate content with image
        response = model.generate_content([prompt_text, image])
        
        # Parse JSON
        raw = response.text.strip()
        fenced_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw, re.IGNORECASE)
        cleaned = fenced_match.group(1).strip() if fenced_match else raw

        try:
            parsed = json.loads(cleaned)
        except Exception:
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1 and end > start:
                candidate = cleaned[start:end + 1]
                try:
                    parsed = json.loads(candidate)
                except Exception:
                    return {"error": "Failed to parse typography JSON", "raw": raw}
            else:
                return {"error": "No typography JSON object found", "raw": raw}

        return parsed
    except Exception as e:
        return {"error": f"Typography generation failed: {str(e)}"}


# ============================================================
# API Endpoints
# ============================================================

@app.post("/extract-colors")
async def extract_colors_endpoint(
    file: UploadFile = File(...),
    color_count: int = Form(5),
    api_key: str = Form(...)
):
    """Extract colors from uploaded logo and generate brand color system."""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file bytes
        image_bytes = await file.read()
        
        # Extract colors using ColorThief
        palette = extract_colors_from_bytes(image_bytes, color_count)
        
        # Generate brand color system using AI
        brand_colors = generate_brand_colors(image_bytes, palette, api_key)
        
        if "error" in brand_colors:
            raise HTTPException(status_code=500, detail=brand_colors["error"])
        
        return JSONResponse(content={
            "success": True,
            "extracted_palette": palette,
            "brand_color_system": brand_colors
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Color extraction failed: {str(e)}")


@app.post("/extract-typography")
async def extract_typography_endpoint(
    file: UploadFile = File(...),
    brand_name: str = Form(...),
    brand_domain: str = Form(...),
    short_description: str = Form(""),
    mood: str = Form("Professional"),
    audience: str = Form("General audience"),
    api_key: str = Form(...),
    detected_font: Optional[str] = Form(default=None)
):
    """Extract typography recommendations from uploaded logo."""
    try:
        print(f"=== TYPOGRAPHY EXTRACTION ENDPOINT CALLED ===")
        print(f"Received parameters:")
        print(f"  - brand_name: {brand_name}")
        print(f"  - brand_domain: {brand_domain}")
        print(f"  - detected_font: {detected_font}")
        print(f"  - detected_font type: {type(detected_font)}")
        print(f"  - detected_font is None: {detected_font is None}")
        print(f"  - detected_font value: '{detected_font}'")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file bytes
        image_bytes = await file.read()
        
        # Prepare brand info
        brand_info = {
            "brand_name": brand_name,
            "brand_domain": brand_domain,
            "short_description": short_description,
            "mood": mood,
            "audience": audience
        }
        
        print(f"Typography extraction called with detected_font: {detected_font}")
        print(f"Will use {'DETECTED FONT' if detected_font else 'AI-SUGGESTED FONTS'} mode")
        
        # Generate typography using AI with detected font (if provided)
        typography = generate_typography_from_logo(image_bytes, brand_info, api_key, detected_font)
        
        print(f"Typography generation result - primary font: {typography.get('primary_font', {}).get('name', 'Unknown')}")
        
        if "error" in typography:
            raise HTTPException(status_code=500, detail=typography["error"])
        
        return JSONResponse(content={
            "success": True,
            "typography": typography
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Typography extraction failed: {str(e)}")


# ============================================================
# Font Detection (ONNX Model)
# ============================================================

class FontDetector:
    def __init__(self, model_path: str = "model.onnx", config_path: str = "model_config.yaml"):
        """Initialize font detector with ONNX model and config."""
        print(f"Initializing FontDetector...")
        print(f"FONT_DETECTION_AVAILABLE: {FONT_DETECTION_AVAILABLE}")
        print(f"Model path exists: {os.path.exists(model_path)}")
        print(f"Config path exists: {os.path.exists(config_path)}")
        
        if not FONT_DETECTION_AVAILABLE:
            self.available = False
            print("Font detection dependencies not available")
            return
            
        self.available = os.path.exists(model_path) and os.path.exists(config_path)
        
        if not self.available:
            print(f"Font detection model or config not found. Model: {os.path.exists(model_path)}, Config: {os.path.exists(config_path)}")
            print(f"Current directory: {os.getcwd()}")
            print(f"Files in current directory: {os.listdir('.')}")
            return
        
        # Load config
        with open(config_path, "r") as f:
            config = yaml.safe_load(f)
        
        self.font_labels = config["classnames"]
        self.num_classes = config["classes"]
        self.input_size = config.get("size", 320)
        
        # Load ONNX model
        self.session = ort.InferenceSession(model_path)
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
        
        # Preprocessing transform
        self.transform = T.Compose([
            T.Resize((self.input_size, self.input_size)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    
    def detect_font(self, image_path_or_bytes: Union[str, bytes], topk: int = 1) -> Optional[str]:
        """
        Detect font from image using OCR + ONNX model.
        Returns the detected font name or None if no text is found.
        """
        print(f"detect_font called, available: {self.available}")
        if not self.available:
            print("Font detector not available, returning None")
            return None
        
        # Load image
        if isinstance(image_path_or_bytes, bytes):
            img = PILImage.open(BytesIO(image_path_or_bytes)).convert("RGB")
        else:
            img = PILImage.open(image_path_or_bytes).convert("RGB")
        
        # OCR: detect if any text exists
        # Try multiple OCR configurations for better detection
        boxes = []
        try:
            # Try default config
            data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
            
            for i, txt in enumerate(data["text"]):
                t = txt.strip()
                if t:
                    left, top, w, h = data["left"][i], data["top"][i], data["width"][i], data["height"][i]
                    boxes.append((left, top, w, h, t))
            
            # If no text found, try with different config (more aggressive)
            if not boxes:
                print("No text found with default config, trying alternative OCR config...")
                # Try with PSM 11 (sparse text) and OEM 3 (default)
                custom_config = r'--oem 3 --psm 11'
                data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT, config=custom_config)
                
                for i, txt in enumerate(data["text"]):
                    t = txt.strip()
                    if t:
                        left, top, w, h = data["left"][i], data["top"][i], data["width"][i], data["height"][i]
                        boxes.append((left, top, w, h, t))
            
            # If still no text, try PSM 6 (assume uniform text block)
            if not boxes:
                print("Still no text, trying PSM 6...")
                custom_config = r'--oem 3 --psm 6'
                data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT, config=custom_config)
                
                for i, txt in enumerate(data["text"]):
                    t = txt.strip()
                    if t:
                        left, top, w, h = data["left"][i], data["top"][i], data["width"][i], data["height"][i]
                        boxes.append((left, top, w, h, t))
                        
        except Exception as e:
            print(f"OCR failed: {e}")
            return None
        
        print(f"OCR detected {len(boxes)} text regions")
        if boxes:
            print(f"Text found: {[b[4] for b in boxes]}")
        
        if not boxes:
            print("No text detected in logo after trying multiple OCR configurations")
            return None  # No text detected
        
        predictions = []
        for (x, y, w, h, text) in boxes:
            crop = img.crop((x, y, x + w, y + h))
            
            # Preprocess
            inp = self.transform(crop).unsqueeze(0).numpy().astype(np.float32)
            
            # Run inference
            logits = self.session.run([self.output_name], {self.input_name: inp})[0][0]
            probs = np.exp(logits) / np.sum(np.exp(logits))  # softmax
            top_idxs = np.argsort(probs)[::-1][:topk]
            
            for idx in top_idxs:
                predictions.append((self.font_labels[idx], float(probs[idx])))
        
        print(f"Font predictions: {predictions[:5] if len(predictions) > 5 else predictions}")
        
        # Return best prediction overall
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[0][0] if predictions else None


# Initialize font detector (will be None if model files don't exist)
font_detector = FontDetector() if FONT_DETECTION_AVAILABLE else None


@app.post("/detect-font")
async def detect_font_endpoint(
    file: UploadFile = File(...),
    api_key: str = Form(...)
):
    """
    Detect font from logo image using ONNX model + OCR.
    If no text is detected, returns None and AI will suggest fonts based on brand context.
    """
    try:
        # Read image
        image_data = await file.read()
        
        # Try font detection if available
        detected_font = None
        if font_detector and font_detector.available:
            detected_font = font_detector.detect_font(image_data)
        
        return JSONResponse(content={
            "success": True,
            "detected_font": detected_font,
            "has_text": detected_font is not None,
            "message": "Font detected from logo" if detected_font else "No text detected in logo"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Font detection failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "color-typography-extraction",
        "font_detection_available": font_detector.available if font_detector else False
    }


# ============================================================
# Run Server
# ============================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
