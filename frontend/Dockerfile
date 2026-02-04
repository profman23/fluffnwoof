# ══════════════════════════════════════════════════════════════
# FluffNwoof Frontend - Production Dockerfile
# Multi-stage build with Nginx for production serving
# ══════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════
# Stage 1: Builder
# ══════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ══════════════════════════════════════════════════════════════
# Stage 2: Production (Nginx)
# ══════════════════════════════════════════════════════════════
FROM nginx:alpine AS production

# Custom nginx config for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Security headers
RUN echo 'server_tokens off;' >> /etc/nginx/nginx.conf

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
