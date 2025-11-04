#!/usr/bin/env python3
"""
Startup script for the Color & Typography Extraction Service
"""

import uvicorn
import os
from pathlib import Path

if __name__ == "__main__":
    # Set the port from environment variable or default to 8001
    port = int(os.getenv("COLOR_SERVICE_PORT", 8001))
    
    # Run the FastAPI server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
