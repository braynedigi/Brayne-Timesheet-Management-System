@echo off
echo 🚀 Starting Timesheet Management System...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose and try again.
    pause
    exit /b 1
)

echo 📦 Building and starting services...
docker-compose up --build -d

echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

echo 🗄️ Setting up database...
docker-compose exec backend npx prisma generate
docker-compose exec backend npx prisma migrate dev --name init

echo 🌱 Seeding database with sample data...
docker-compose exec backend npm run db:seed

echo ✅ Setup complete!
echo.
echo 🌐 Access your application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:5000
echo    API Documentation: http://localhost:5000/api/docs
echo    Health Check: http://localhost:5000/health
echo.
echo 📋 Useful commands:
echo    View logs: npm run logs
echo    Stop services: npm run stop
echo    Clean up: npm run clean
echo.
echo 🔧 Default login credentials:
echo    Admin: admin@example.com / password123
echo    Employee: employee@example.com / password123
echo    Client: client@example.com / password123
echo.
pause
