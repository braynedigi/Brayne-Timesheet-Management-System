@echo off
echo ========================================
echo Brayne Timesheet Management System
echo Docker Setup
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Docker is running. Starting services...
echo.

REM Start all services
docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Services started successfully!
    echo ========================================
    echo.
    echo Frontend: http://localhost:3000
    echo Backend API: http://localhost:5000
    echo Database: localhost:5432
    echo.
    echo To view logs: docker-compose logs -f
    echo To stop services: docker-compose down
    echo.
    echo Default login credentials:
    echo Admin: admin@timesheet.com / admin123
    echo Employee: employee@timesheet.com / employee123
    echo Client: client@timesheet.com / client123
    echo.
) else (
    echo.
    echo ERROR: Failed to start services!
    echo Check the logs with: docker-compose logs
    echo.
)

pause
