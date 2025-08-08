FROM node:18-slim

# Install OpenSSL and other required dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Starting Backend API..."' >> /app/start.sh && \
    echo 'echo "🗄️ Setting up database..."' >> /app/start.sh && \
    echo 'npx prisma migrate deploy' >> /app/start.sh && \
    echo 'echo "🌱 Seeding database..."' >> /app/start.sh && \
    echo 'npm run db:seed' >> /app/start.sh && \
    echo 'echo "🔧 Starting server..."' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start the server
CMD ["/app/start.sh"]
