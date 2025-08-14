#!/bin/bash

echo "========================================"
echo "Brayne Timesheet Management System"
echo "Docker Setup"
echo "========================================"
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "Docker is running. Starting services..."
echo

# Start all services
docker-compose up -d

if [ $? -eq 0 ]; then
    echo
    echo "========================================"
    echo "Services started successfully!"
    echo "========================================"
    echo
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:5000"
    echo "Database: localhost:5432"
    echo
    echo "To view logs: docker-compose logs -f"
    echo "To stop services: docker-compose down"
    echo
    echo "Default login credentials:"
    echo "Admin: admin@timesheet.com / admin123"
    echo "Employee: employee@timesheet.com / employee123"
    echo "Client: client@timesheet.com / client123"
    echo
else
    echo
    echo "ERROR: Failed to start services!"
    echo "Check the logs with: docker-compose logs"
    echo
    exit 1
fi
