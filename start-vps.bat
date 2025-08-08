@echo off
echo 🚀 Starting Timesheet Management System on VPS...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Create network for services to communicate
echo 🌐 Creating Docker network...
docker network create timesheet-network 2>nul || echo Network already exists

REM Build and start database
echo 🗄️ Building and starting database...
cd database
docker build -t timesheet-db .
docker run -d --name timesheet-postgres --network timesheet-network -p 5432:5432 -v postgres_data:/var/lib/postgresql/data timesheet-db
cd ..

REM Wait for database to be ready
echo ⏳ Waiting for database to be ready...
timeout /t 15 /nobreak >nul

REM Build and start backend
echo 🔧 Building and starting backend...
cd backend
docker build -t timesheet-backend .
docker run -d --name timesheet-backend --network timesheet-network -p 5000:5000 -e DATABASE_URL=postgresql://timesheet_user:timesheet_password@timesheet-postgres:5432/timesheet_db -e JWT_SECRET=your-super-secret-jwt-key-change-in-production -e JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production -e PORT=5000 timesheet-backend
cd ..

REM Wait for backend to be ready
echo ⏳ Waiting for backend to be ready...
timeout /t 10 /nobreak >nul

REM Build and start frontend
echo 🌐 Building and starting frontend...
cd frontend
docker build -t timesheet-frontend .
docker run -d --name timesheet-frontend --network timesheet-network -p 3000:3000 -e REACT_APP_API_URL=http://localhost:5000/api timesheet-frontend
cd ..

echo ✅ Setup complete!
echo.
echo 🌐 Access your application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:5000
echo    API Documentation: http://localhost:5000/api/docs
echo    Health Check: http://localhost:5000/health
echo.
echo 📋 Useful commands:
echo    View logs: docker logs timesheet-frontend
echo    Stop services: docker stop timesheet-frontend timesheet-backend timesheet-postgres
echo    Clean up: docker rm timesheet-frontend timesheet-backend timesheet-postgres
echo.
echo 🔧 Default login credentials:
echo    Admin: admin@example.com / password123
echo    Employee: employee@example.com / password123
echo    Client: client@example.com / password123
pause
