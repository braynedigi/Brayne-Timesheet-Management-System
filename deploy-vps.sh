#!/bin/bash

# VPS Deployment Script for Brayne Timesheet Management System
# This script deploys the system using Dockerfiles (no docker-compose required)

set -e

echo "🚀 Starting VPS deployment for Brayne Timesheet Management System..."

# Configuration
PROJECT_NAME="brayne-timesheet"
FRONTEND_IMAGE="${PROJECT_NAME}-frontend"
BACKEND_IMAGE="${PROJECT_NAME}-backend"
COMBINED_IMAGE="${PROJECT_NAME}-combined"
NETWORK_NAME="${PROJECT_NAME}-network"
POSTGRES_IMAGE="postgres:15-alpine"
POSTGRES_CONTAINER="${PROJECT_NAME}-postgres"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to create Docker network
create_network() {
    if ! docker network ls | grep -q $NETWORK_NAME; then
        print_status "Creating Docker network: $NETWORK_NAME"
        docker network create $NETWORK_NAME
        print_success "Network created"
    else
        print_status "Network $NETWORK_NAME already exists"
    fi
}

# Function to stop and remove containers
cleanup_containers() {
    print_status "Cleaning up existing containers..."
    
    # Stop and remove containers
    docker stop $POSTGRES_CONTAINER 2>/dev/null || true
    docker rm $POSTGRES_CONTAINER 2>/dev/null || true
    
    docker stop $FRONTEND_IMAGE 2>/dev/null || true
    docker rm $FRONTEND_IMAGE 2>/dev/null || true
    
    docker stop $BACKEND_IMAGE 2>/dev/null || true
    docker rm $BACKEND_IMAGE 2>/dev/null || true
    
    docker stop $COMBINED_IMAGE 2>/dev/null || true
    docker rm $COMBINED_IMAGE 2>/dev/null || true
    
    print_success "Containers cleaned up"
}

# Function to deploy PostgreSQL
deploy_postgres() {
    print_status "Deploying PostgreSQL database..."
    
    # Create PostgreSQL container
    docker run -d \
        --name $POSTGRES_CONTAINER \
        --network $NETWORK_NAME \
        -e POSTGRES_DB=timesheet \
        -e POSTGRES_USER=timesheet_user \
        -e POSTGRES_PASSWORD=timesheet_password \
        -v postgres_data:/var/lib/postgresql/data \
        -p 5432:5432 \
        $POSTGRES_IMAGE
    
    print_success "PostgreSQL deployed"
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    sleep 10
}

# Function to deploy using combined Dockerfile
deploy_combined() {
    print_status "Building combined Docker image..."
    
    # Build the combined image
    docker build -f Dockerfile.vps -t $COMBINED_IMAGE .
    
    print_success "Combined image built"
    
    print_status "Starting combined container..."
    
    # Run the combined container
    docker run -d \
        --name $COMBINED_IMAGE \
        --network $NETWORK_NAME \
        -e DATABASE_URL="postgresql://timesheet_user:timesheet_password@$POSTGRES_CONTAINER:5432/timesheet" \
        -e NODE_ENV=production \
        -e JWT_SECRET=your_jwt_secret_here \
        -e PORT=5000 \
        -p 3000:3000 \
        -p 5000:5000 \
        $COMBINED_IMAGE
    
    print_success "Combined container started"
}

# Function to deploy using separate Dockerfiles
deploy_separate() {
    print_status "Building separate Docker images..."
    
    # Build frontend image
    docker build -f Dockerfile.frontend -t $FRONTEND_IMAGE .
    print_success "Frontend image built"
    
    # Build backend image
    docker build -f Dockerfile.backend -t $BACKEND_IMAGE .
    print_success "Backend image built"
    
    print_status "Starting separate containers..."
    
    # Start backend container
    docker run -d \
        --name $BACKEND_IMAGE \
        --network $NETWORK_NAME \
        -e DATABASE_URL="postgresql://timesheet_user:timesheet_password@$POSTGRES_CONTAINER:5432/timesheet" \
        -e NODE_ENV=production \
        -e JWT_SECRET=your_jwt_secret_here \
        -e PORT=5000 \
        -p 5000:5000 \
        $BACKEND_IMAGE
    
    print_success "Backend container started"
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    sleep 10
    
    # Start frontend container
    docker run -d \
        --name $FRONTEND_IMAGE \
        --network $NETWORK_NAME \
        -p 80:80 \
        $FRONTEND_IMAGE
    
    print_success "Frontend container started"
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    echo "----------------------------------------"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo "----------------------------------------"
    
    print_status "Access URLs:"
    echo "Frontend: http://localhost (or your VPS IP)"
    echo "Backend API: http://localhost:5000"
    echo "API Documentation: http://localhost:5000/api/docs"
}

# Function to show logs
show_logs() {
    print_status "Container logs:"
    echo "----------------------------------------"
    
    if docker ps | grep -q $COMBINED_IMAGE; then
        echo "Combined container logs:"
        docker logs $COMBINED_IMAGE --tail 20
    else
        if docker ps | grep -q $FRONTEND_IMAGE; then
            echo "Frontend container logs:"
            docker logs $FRONTEND_IMAGE --tail 20
        fi
        
        if docker ps | grep -q $BACKEND_IMAGE; then
            echo "Backend container logs:"
            docker logs $BACKEND_IMAGE --tail 20
        fi
    fi
    
    echo "----------------------------------------"
}

# Main deployment logic
main() {
    print_status "Starting deployment..."
    
    # Check prerequisites
    check_docker
    
    # Clean up existing containers
    cleanup_containers
    
    # Create network
    create_network
    
    # Deploy PostgreSQL
    deploy_postgres
    
    # Choose deployment method
    echo ""
    print_status "Choose deployment method:"
    echo "1. Combined deployment (single container)"
    echo "2. Separate deployment (frontend + backend)"
    read -p "Enter your choice (1 or 2): " choice
    
    case $choice in
        1)
            print_status "Deploying using combined Dockerfile..."
            deploy_combined
            ;;
        2)
            print_status "Deploying using separate Dockerfiles..."
            deploy_separate
            ;;
        *)
            print_error "Invalid choice. Using combined deployment."
            deploy_combined
            ;;
    esac
    
    # Show status
    show_status
    
    print_success "Deployment completed successfully!"
    print_status "You can now access your application at:"
    echo "Frontend: http://localhost (or your VPS IP)"
    echo "Backend API: http://localhost:5000"
    
    # Ask if user wants to see logs
    read -p "Do you want to see container logs? (y/n): " show_logs_choice
    if [[ $show_logs_choice =~ ^[Yy]$ ]]; then
        show_logs
    fi
}

# Handle script arguments
case "${1:-}" in
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "cleanup")
        cleanup_containers
        print_success "Cleanup completed"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Deploy the application"
        echo "  status     Show deployment status"
        echo "  logs       Show container logs"
        echo "  cleanup    Stop and remove containers"
        echo "  help       Show this help message"
        ;;
    *)
        main
        ;;
esac
