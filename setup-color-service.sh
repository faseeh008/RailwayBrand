#!/bin/bash

echo "🎨 Setting up Color & Typography Extraction Service..."

# Check if Python 3.11+ is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.11+ is required. Current version: $python_version"
    exit 1
fi

echo "✅ Python version check passed: $python_version"

# Navigate to color service directory
cd color-service

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Color service dependencies installed!"

# Check if GOOGLE_GEMINI_API is set
if [ -z "$GOOGLE_GEMINI_API" ]; then
    echo "⚠️  Warning: GOOGLE_GEMINI_API environment variable is not set."
    echo "   Please set it in your .env file or environment."
    echo "   Example: export GOOGLE_GEMINI_API='your-api-key-here'"
fi

# Create uploads directory
mkdir -p ../static/uploads/logos

echo "🚀 Color service setup complete!"
echo ""
echo "To start the color service:"
echo "1. Activate the virtual environment: source color-service/venv/bin/activate"
echo "2. Start the service: cd color-service && python start.py"
echo ""
echo "Or use Docker:"
echo "docker-compose up color-service"
echo ""
echo "The service will be available at: http://localhost:8001"
echo "Health check: http://localhost:8001/health"
