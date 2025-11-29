FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (including Tesseract OCR for font detection and curl for healthcheck)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    tesseract-ocr \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --upgrade pip setuptools wheel

# Copy requirements first for better caching
COPY requirements.txt .

# Install PyTorch CPU-only first (much smaller and faster than CUDA version)
# Then install other dependencies with increased timeout and retries
RUN pip install --no-cache-dir --timeout=600 --retries=5 --index-url https://download.pytorch.org/whl/cpu torch torchvision && \
    pip install --no-cache-dir --timeout=600 --retries=5 -r requirements.txt

# Copy application code
COPY . .

# Create directory for uploads
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run the application
CMD ["python", "start.py"]
