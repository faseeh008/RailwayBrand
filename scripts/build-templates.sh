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
  
  # Show current directory for debugging
  echo "   Current directory: $(pwd)"
  
  # Install dependencies INCLUDING devDependencies (needed for build tools)
  # Use --include=dev to ensure devDependencies are installed even if NODE_ENV=production
  echo "   Installing dependencies (including devDependencies)..."
  if [ -f "package-lock.json" ]; then
    npm ci --include=dev || npm install --include=dev
  else
    npm install --include=dev
  fi
  
  # Verify installation succeeded by checking for node_modules
  if [ ! -d "node_modules" ]; then
    echo "❌ ERROR: node_modules not found after installation for $template"
    echo "   Installation may have failed"
    exit 1
  fi
  
  # Verify the specific package exists
  if [ ! -d "node_modules/@vitejs/plugin-react-swc" ]; then
    echo "❌ ERROR: @vitejs/plugin-react-swc not found in node_modules"
    echo "   This package is required for building. Attempting to install explicitly..."
    npm install @vitejs/plugin-react-swc --save-dev
    if [ ! -d "node_modules/@vitejs/plugin-react-swc" ]; then
      echo "❌ ERROR: Failed to install @vitejs/plugin-react-swc"
      exit 1
    fi
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
