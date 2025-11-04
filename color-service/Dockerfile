FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (including Tesseract OCR for font detection)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

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
