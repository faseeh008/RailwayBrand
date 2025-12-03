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

# Copy React template builds (only build directories and index.html, not node_modules or source)
COPY --from=builder --chown=sveltekit:nodejs /app/react-templates/Minimalistic/build ./react-templates/Minimalistic/build
COPY --from=builder --chown=sveltekit:nodejs /app/react-templates/Minimalistic/index.html ./react-templates/Minimalistic/index.html
COPY --from=builder --chown=sveltekit:nodejs /app/react-templates/Maximalistic/build ./react-templates/Maximalistic/build
COPY --from=builder --chown=sveltekit:nodejs /app/react-templates/Maximalistic/index.html ./react-templates/Maximalistic/index.html
COPY --from=builder --chown=sveltekit:nodejs /app/react-templates/Funky/build ./react-templates/Funky/build
COPY --from=builder --chown=sveltekit:nodejs /app/react-templates/Funky/index.html ./react-templates/Funky/index.html
COPY --from=builder --chown=sveltekit:nodejs /app/react-templates/Futuristic/build ./react-templates/Futuristic/build
COPY --from=builder --chown=sveltekit:nodejs /app/react-templates/Futuristic/index.html ./react-templates/Futuristic/index.html

# Install only production dependencies
COPY --from=deps --chown=sveltekit:nodejs /app/node_modules ./node_modules

USER sveltekit

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "build/index.js"]

