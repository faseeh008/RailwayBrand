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
    npm ci --silent || npm install --silent
  else
    npm install --silent
  fi
  
  # Build the template
  echo "   Building..."
  npm run build
  
  # Verify build directory exists
  if [ ! -d "build" ]; then
    echo "⚠️  Warning: build directory not found for $template after build"
  else
    echo "✅ $template built successfully"
  fi
  
  cd ../..
done

echo "🎉 All React templates built successfully!"

