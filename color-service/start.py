#!/usr/bin/env python3
"""
Startup script for the Color & Typography Extraction Service
"""

import uvicorn
import os
from pathlib import Path

if __name__ == "__main__":
    # Set the port from environment variable (Railway uses PORT, or fallback to COLOR_SERVICE_PORT or default)
    port = int(os.getenv("PORT") or os.getenv("COLOR_SERVICE_PORT") or 8001)
    
    # Run the FastAPI server
    # reload=False in Docker to prevent restart loops
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
