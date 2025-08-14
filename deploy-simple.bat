@echo off
echo ========================================
echo Brayne Timesheet - Simple Docker Deploy
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

REM Configuration
set IMAGE_NAME=brayne-timesheet
set CONTAINER_NAME=brayne-timesheet-container
set FRONTEND_PORT=3000
set BACKEND_PORT=5000

echo Building Docker image...
docker build -t %IMAGE_NAME% .

if %errorlevel% equ 0 (
    echo ✅ Image built successfully!
    echo.
    
    echo Stopping existing container...
    docker stop %CONTAINER_NAME% 2>nul
    docker rm %CONTAINER_NAME% 2>nul
    
    echo Starting new container...
    docker run -d --name %CONTAINER_NAME% -p %FRONTEND_PORT%:3000 -p %BACKEND_PORT%:5000 --restart unless-stopped %IMAGE_NAME%
    
    if %errorlevel% equ 0 (
        echo ✅ Container started successfully!
        echo.
        echo ========================================
        echo Application is now running!
        echo ========================================
        echo Frontend: http://localhost:%FRONTEND_PORT%
        echo Backend API: http://localhost:%BACKEND_PORT%
        echo.
        echo To view logs: docker logs -f %CONTAINER_NAME%
        echo To stop: docker stop %CONTAINER_NAME%
        echo To restart: docker restart %CONTAINER_NAME%
    ) else (
        echo ❌ Failed to start container!
    )
) else (
    echo ❌ Failed to build image!
)

pause
