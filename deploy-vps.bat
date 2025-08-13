@echo off
setlocal enabledelayedexpansion

REM VPS Deployment Script for Brayne Timesheet Management System (Windows)
REM This script deploys the system using Dockerfiles (no docker-compose required)

echo 🚀 Starting VPS deployment for Brayne Timesheet Management System...

REM Configuration
set PROJECT_NAME=brayne-timesheet
set FRONTEND_IMAGE=%PROJECT_NAME%-frontend
set BACKEND_IMAGE=%PROJECT_NAME%-backend
set COMBINED_IMAGE=%PROJECT_NAME%-combined
set NETWORK_NAME=%PROJECT_NAME%-network
set POSTGRES_IMAGE=postgres:15-alpine
set POSTGRES_CONTAINER=%PROJECT_NAME%-postgres

REM Function to check if Docker is running
:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)
echo [SUCCESS] Docker is running
goto :eof

REM Function to create Docker network
:create_network
docker network ls | findstr %NETWORK_NAME% >nul 2>&1
if errorlevel 1 (
    echo [INFO] Creating Docker network: %NETWORK_NAME%
    docker network create %NETWORK_NAME%
    echo [SUCCESS] Network created
) else (
    echo [INFO] Network %NETWORK_NAME% already exists
)
goto :eof

REM Function to stop and remove containers
:cleanup_containers
echo [INFO] Cleaning up existing containers...

docker stop %POSTGRES_CONTAINER% 2>nul
docker rm %POSTGRES_CONTAINER% 2>nul

docker stop %FRONTEND_IMAGE% 2>nul
docker rm %FRONTEND_IMAGE% 2>nul

docker stop %BACKEND_IMAGE% 2>nul
docker rm %BACKEND_IMAGE% 2>nul

docker stop %COMBINED_IMAGE% 2>nul
docker rm %COMBINED_IMAGE% 2>nul

echo [SUCCESS] Containers cleaned up
goto :eof

REM Function to deploy PostgreSQL
:deploy_postgres
echo [INFO] Deploying PostgreSQL database...

docker run -d --name %POSTGRES_CONTAINER% --network %NETWORK_NAME% -e POSTGRES_DB=timesheet -e POSTGRES_USER=timesheet_user -e POSTGRES_PASSWORD=timesheet_password -v postgres_data:/var/lib/postgresql/data -p 5432:5432 %POSTGRES_IMAGE%

echo [SUCCESS] PostgreSQL deployed

echo [INFO] Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul
goto :eof

REM Function to deploy using combined Dockerfile
:deploy_combined
echo [INFO] Building combined Docker image...

docker build -f Dockerfile.vps -t %COMBINED_IMAGE% .

echo [SUCCESS] Combined image built

echo [INFO] Starting combined container...

docker run -d --name %COMBINED_IMAGE% --network %NETWORK_NAME% -e DATABASE_URL="postgresql://timesheet_user:timesheet_password@%POSTGRES_CONTAINER%:5432/timesheet" -e NODE_ENV=production -e JWT_SECRET=your_jwt_secret_here -e PORT=5000 -p 3000:3000 -p 5000:5000 %COMBINED_IMAGE%

echo [SUCCESS] Combined container started
goto :eof

REM Function to deploy using separate Dockerfiles
:deploy_separate
echo [INFO] Building separate Docker images...

docker build -f Dockerfile.frontend -t %FRONTEND_IMAGE% .
echo [SUCCESS] Frontend image built

docker build -f Dockerfile.backend -t %BACKEND_IMAGE% .
echo [SUCCESS] Backend image built

echo [INFO] Starting separate containers...

docker run -d --name %BACKEND_IMAGE% --network %NETWORK_NAME% -e DATABASE_URL="postgresql://timesheet_user:timesheet_password@%POSTGRES_CONTAINER%:5432/timesheet" -e NODE_ENV=production -e JWT_SECRET=your_jwt_secret_here -e PORT=5000 -p 5000:5000 %BACKEND_IMAGE%

echo [SUCCESS] Backend container started

echo [INFO] Waiting for backend to be ready...
timeout /t 10 /nobreak >nul

docker run -d --name %FRONTEND_IMAGE% --network %NETWORK_NAME% -p 80:80 %FRONTEND_IMAGE%

echo [SUCCESS] Frontend container started
goto :eof

REM Function to show deployment status
:show_status
echo [INFO] Deployment Status:
echo ----------------------------------------
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ----------------------------------------

echo [INFO] Access URLs:
echo Frontend: http://localhost (or your VPS IP)
echo Backend API: http://localhost:5000
echo API Documentation: http://localhost:5000/api/docs
goto :eof

REM Function to show logs
:show_logs
echo [INFO] Container logs:
echo ----------------------------------------

docker ps | findstr %COMBINED_IMAGE% >nul 2>&1
if not errorlevel 1 (
    echo Combined container logs:
    docker logs %COMBINED_IMAGE% --tail 20
) else (
    docker ps | findstr %FRONTEND_IMAGE% >nul 2>&1
    if not errorlevel 1 (
        echo Frontend container logs:
        docker logs %FRONTEND_IMAGE% --tail 20
    )
    
    docker ps | findstr %BACKEND_IMAGE% >nul 2>&1
    if not errorlevel 1 (
        echo Backend container logs:
        docker logs %BACKEND_IMAGE% --tail 20
    )
)

echo ----------------------------------------
goto :eof

REM Main deployment logic
:main
echo [INFO] Starting deployment...

call :check_docker
call :cleanup_containers
call :create_network
call :deploy_postgres

echo.
echo [INFO] Choose deployment method:
echo 1. Combined deployment (single container)
echo 2. Separate deployment (frontend + backend)
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo [INFO] Deploying using combined Dockerfile...
    call :deploy_combined
) else if "%choice%"=="2" (
    echo [INFO] Deploying using separate Dockerfiles...
    call :deploy_separate
) else (
    echo [ERROR] Invalid choice. Using combined deployment.
    call :deploy_combined
)

call :show_status

echo [SUCCESS] Deployment completed successfully!
echo [INFO] You can now access your application at:
echo Frontend: http://localhost (or your VPS IP)
echo Backend API: http://localhost:5000

set /p show_logs_choice="Do you want to see container logs? (y/n): "
if /i "%show_logs_choice%"=="y" (
    call :show_logs
)

goto :eof

REM Handle script arguments
if "%1"=="status" (
    call :show_status
    goto :eof
)

if "%1"=="logs" (
    call :show_logs
    goto :eof
)

if "%1"=="cleanup" (
    call :cleanup_containers
    echo [SUCCESS] Cleanup completed
    goto :eof
)

if "%1"=="help" (
    echo Usage: %0 [command]
    echo.
    echo Commands:
    echo   (no args)  Deploy the application
    echo   status     Show deployment status
    echo   logs       Show container logs
    echo   cleanup    Stop and remove containers
    echo   help       Show this help message
    goto :eof
)

REM Default: run main deployment
call :main

pause
