# Multi-stage build for Timesheet Management System
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    openssl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build frontend
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    openssl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy built application
COPY --from=base /app/backend ./backend
COPY --from=base /app/frontend/dist ./frontend/dist
COPY --from=base /app/frontend/package*.json ./frontend/
COPY --from=base /app/backend/package*.json ./backend/

# Install production dependencies
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci --only=production

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting Timesheet Management System..."' >> /app/start.sh && \
    echo 'cd /app/backend' >> /app/start.sh && \
    echo 'npx prisma migrate deploy' >> /app/start.sh && \
    echo 'npm start &' >> /app/start.sh && \
    echo 'cd /app/frontend' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose ports
EXPOSE 3000 5000

# Start the application
CMD ["/app/start.sh"]
