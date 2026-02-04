# ══════════════════════════════════════════════════════════════
# FluffNwoof Backend - Production Dockerfile
# Multi-stage build for optimal image size and security
# ══════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════
# Stage 1: Dependencies
# ══════════════════════════════════════════════════════════════
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies only (for caching)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force
RUN npx prisma generate

# ══════════════════════════════════════════════════════════════
# Stage 2: Builder
# ══════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npm run build

# ══════════════════════════════════════════════════════════════
# Stage 3: Production
# ══════════════════════════════════════════════════════════════
FROM node:20-alpine AS production
WORKDIR /app

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

USER nodejs
EXPOSE 5000

CMD ["node", "dist/server.js"]
