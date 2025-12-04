# Use Node.js 22 Alpine as base image (matching package.json requirement)
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install system dependencies for Playwright
RUN apk add --no-cache \
    libc6-compat \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    && rm -rf /var/cache/apk/*

# Set Playwright environment variables to use system Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
# Install system dependencies for Playwright in builder stage too
RUN apk add --no-cache \
    libc6-compat \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    && rm -rf /var/cache/apk/*

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build React templates first (before main app build)
RUN echo "🔨 Building React templates..." && \
    chmod +x scripts/build-templates.sh && \
    ./scripts/build-templates.sh

# Verify build directories were created
RUN echo "🔍 Verifying React template builds..." && \
    for template in Minimalistic Maximalistic Funky Futuristic; do \
      if [ ! -d "react-templates/$template/build" ]; then \
        echo "❌ ERROR: Build directory not found for $template"; \
        echo "Listing react-templates/$template:"; \
        ls -la "react-templates/$template/" || echo "Directory does not exist"; \
        exit 1; \
      else \
        echo "✅ Build directory exists for $template"; \
        if [ ! -f "react-templates/$template/build/index.html" ]; then \
          echo "❌ ERROR: index.html not found in $template/build"; \
          echo "Contents of react-templates/$template/build:"; \
          ls -la "react-templates/$template/build/" || echo "Directory is empty"; \
          exit 1; \
        else \
          echo "✅ index.html found in $template/build"; \
          echo "   File size: $(du -h react-templates/$template/build/index.html | cut -f1)"; \
        fi; \
      fi; \
    done && \
    echo "🎉 All React template builds verified successfully!"

# Generate database schema
RUN npm run db:generate

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
# Install system dependencies for Playwright in runner stage
RUN apk add --no-cache \
    libc6-compat \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    && rm -rf /var/cache/apk/*

# Set Playwright environment variables
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 sveltekit

# Create temp uploads and screenshots directories with proper permissions
RUN mkdir -p /app/temp-uploads /app/screenshots && chown -R sveltekit:nodejs /app/temp-uploads /app/screenshots

# Copy the built application
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./package.json
COPY --from=builder --chown=sveltekit:nodejs /app/drizzle ./drizzle

# Copy React template builds - copy entire directory structure
# This ensures builds are available whether running from /app (Docker) or /opt/render/project/src (Render)
# Copy only the build directories and index.html files (exclude node_modules and source files)
COPY --from=builder --chown=sveltekit:nodejs /app/react-templates ./react-templates

# Verify build directories were copied successfully
RUN echo "🔍 Verifying copied React template builds..." && \
    for template in Minimalistic Maximalistic Funky Futuristic; do \
      if [ -f "react-templates/$template/build/index.html" ]; then \
        echo "✅ $template build/index.html copied successfully"; \
        echo "   File size: $(du -h react-templates/$template/build/index.html | cut -f1)"; \
        if [ -d "react-templates/$template/build/assets" ]; then \
          echo "   Assets directory exists with $(ls react-templates/$template/build/assets | wc -l) files"; \
        else \
          echo "   ⚠️ WARNING: Assets directory not found for $template"; \
        fi; \
      else \
        echo "❌ ERROR: $template build/index.html not found after copy"; \
        echo "   Checking if directory exists:"; \
        ls -la "react-templates/$template/" || echo "   Directory does not exist"; \
      fi; \
    done && \
    echo "🎉 React template build verification complete!"

# Install only production dependencies
COPY --from=deps --chown=sveltekit:nodejs /app/node_modules ./node_modules

USER sveltekit

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "build/index.js"]

