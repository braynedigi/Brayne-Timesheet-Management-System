#!/bin/bash

echo "========================================"
echo "Brayne Timesheet - Simple Docker Deploy"
echo "========================================"
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

# Configuration
IMAGE_NAME="brayne-timesheet"
CONTAINER_NAME="brayne-timesheet-container"
FRONTEND_PORT=3000
BACKEND_PORT=5000

echo "Building Docker image..."
docker build -t $IMAGE_NAME .

if [ $? -eq 0 ]; then
    echo "✅ Image built successfully!"
    echo
    
    echo "Stopping existing container..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    
    echo "Starting new container..."
    docker run -d \
        --name $CONTAINER_NAME \
        -p $FRONTEND_PORT:3000 \
        -p $BACKEND_PORT:5000 \
        --restart unless-stopped \
        $IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ Container started successfully!"
        echo
        echo "========================================"
        echo "Application is now running!"
        echo "========================================"
        echo "Frontend: http://localhost:$FRONTEND_PORT"
        echo "Backend API: http://localhost:$BACKEND_PORT"
        echo
        echo "To view logs: docker logs -f $CONTAINER_NAME"
        echo "To stop: docker stop $CONTAINER_NAME"
        echo "To restart: docker restart $CONTAINER_NAME"
    else
        echo "❌ Failed to start container!"
        exit 1
    fi
else
    echo "❌ Failed to build image!"
    exit 1
fi
