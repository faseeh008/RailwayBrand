#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm install

echo "🔄 Running svelte-kit sync..."
npx svelte-kit sync || echo "Sync had warnings but continuing..."

echo "🏗️ Building application..."
npm run build

echo "✅ Build complete!"

