#!/bin/sh
set -e

echo "🔨 Building React templates..."

for template in Minimalistic Maximalistic Funky Futuristic; do
  echo "📦 Building $template..."
  cd "react-templates/$template"
  
  # Check if package.json exists
  if [ ! -f "package.json" ]; then
    echo "⚠️  Warning: package.json not found in $template, skipping..."
    cd ../..
    continue
  fi
  
  # Install dependencies (try npm ci first, fallback to npm install)
  echo "   Installing dependencies..."
  if [ -f "package-lock.json" ]; then
    npm ci || npm install
  else
    npm install
  fi
  
  # Verify installation succeeded by checking for node_modules
  if [ ! -d "node_modules" ]; then
    echo "❌ ERROR: node_modules not found after installation for $template"
    echo "   Installation may have failed"
    exit 1
  fi
  
  # Build the template
  echo "   Building..."
  npm run build
  
  # Verify build directory exists and contains index.html
  if [ ! -d "build" ]; then
    echo "❌ ERROR: build directory not found for $template after build"
    echo "   Current directory: $(pwd)"
    echo "   Directory contents:"
    ls -la || echo "   Cannot list directory"
    exit 1
  fi
  
  if [ ! -f "build/index.html" ]; then
    echo "❌ ERROR: build/index.html not found for $template after build"
    echo "   Build directory contents:"
    ls -la build/ || echo "   Cannot list build directory"
    exit 1
  fi
  
  echo "✅ $template built successfully"
  echo "   Build directory size: $(du -sh build | cut -f1)"
  echo "   index.html size: $(du -h build/index.html | cut -f1)"
  
  cd ../..
done

echo "🎉 All React templates built successfully!"

