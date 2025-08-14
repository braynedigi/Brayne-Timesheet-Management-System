# ========================================
# Brayne Timesheet Management System
# Comprehensive Dockerfile for All Platforms
# ========================================

# Use Node.js 18 Alpine as base image
FROM node:18-alpine AS base

# Set environment variables to prevent Laravel detection
ENV NODE_ENV=production
ENV PLATFORM=nodejs
ENV FRAMEWORK=express
ENV LANGUAGE=javascript
ENV RUNTIME=node

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    openssl \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies
RUN npm install
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build frontend for production
RUN cd frontend && npm run build

# ========================================
# Production Stage
# ========================================
FROM node:18-alpine AS production

# Set environment variables
ENV NODE_ENV=production
ENV PLATFORM=nodejs
ENV FRAMEWORK=express
ENV LANGUAGE=javascript
ENV RUNTIME=node
ENV PORT=3000
ENV BACKEND_PORT=5000

# Install production dependencies
RUN apk add --no-cache \
    postgresql-client \
    openssl \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy built application from base stage
COPY --from=base /app/backend ./backend
COPY --from=base /app/frontend/dist ./frontend/dist
COPY --from=base /app/frontend/package*.json ./frontend/
COPY --from=base /app/backend/package*.json ./backend/
COPY --from=base /app/backend/prisma ./backend/prisma

# Install only production dependencies
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci --only=production

# Create necessary directories
RUN mkdir -p /app/backend/uploads
RUN mkdir -p /app/backend/logs

# Create comprehensive startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "========================================"' >> /app/start.sh && \
    echo 'echo "Brayne Timesheet Management System"' >> /app/start.sh && \
    echo 'echo "Node.js Application Starting..."' >> /app/start.sh && \
    echo 'echo "========================================"' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo 'echo "Platform: $PLATFORM"' >> /app/start.sh && \
    echo 'echo "Framework: $FRAMEWORK"' >> /app/start.sh && \
    echo 'echo "Language: $LANGUAGE"' >> /app/start.sh && \
    echo 'echo "Runtime: $RUNTIME"' >> /app/start.sh && \
    echo 'echo "Node Version: $(node --version)"' >> /app/start.sh && \
    echo 'echo "NPM Version: $(npm --version)"' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo 'echo "Starting Backend API..."' >> /app/start.sh && \
    echo 'cd /app/backend' >> /app/start.sh && \
    echo 'echo "Running database migrations..."' >> /app/start.sh && \
    echo 'npx prisma migrate deploy' >> /app/start.sh && \
    echo 'echo "Starting backend server on port $BACKEND_PORT..."' >> /app/start.sh && \
    echo 'npm start &' >> /app/start.sh && \
    echo 'echo "Backend started successfully"' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo 'echo "Starting Frontend..."' >> /app/start.sh && \
    echo 'cd /app/frontend' >> /app/start.sh && \
    echo 'echo "Starting frontend server on port $PORT..."' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Create health check script
RUN echo '#!/bin/sh' > /app/healthcheck.sh && \
    echo 'curl -f http://localhost:3000 || exit 1' >> /app/healthcheck.sh && \
    echo 'curl -f http://localhost:5000/api/health || exit 1' >> /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh

# Expose ports
EXPOSE 3000 5000

# Set health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /app/healthcheck.sh

# Create platform detection prevention file
RUN echo 'This is a Node.js application, not PHP/Laravel' > /app/PLATFORM_INFO.txt && \
    echo 'Framework: Express.js' >> /app/PLATFORM_INFO.txt && \
    echo 'Language: JavaScript/TypeScript' >> /app/PLATFORM_INFO.txt && \
    echo 'Runtime: Node.js' >> /app/PLATFORM_INFO.txt && \
    echo 'Database: PostgreSQL with Prisma' >> /app/PLATFORM_INFO.txt

# Start the application
CMD ["/app/start.sh"]

# ========================================
# Development Stage (Optional)
# ========================================
FROM base AS development

ENV NODE_ENV=development
ENV PLATFORM=nodejs
ENV FRAMEWORK=express
ENV LANGUAGE=javascript
ENV RUNTIME=node

# Install development dependencies
RUN cd backend && npm install
RUN cd frontend && npm install

# Create development startup script
RUN echo '#!/bin/sh' > /app/dev-start.sh && \
    echo 'echo "Starting in development mode..."' >> /app/dev-start.sh && \
    echo 'cd /app/backend && npm run dev &' >> /app/dev-start.sh && \
    echo 'cd /app/frontend && npm run dev' >> /app/dev-start.sh && \
    chmod +x /app/dev-start.sh

EXPOSE 3000 5000 5173

CMD ["/app/dev-start.sh"]
