# Getting Started Guide

## Prerequisites

Before you begin, make sure you have the following installed:

- **Docker Desktop** (with Docker Compose)
- **Node.js** 18+ (optional, for local development without Docker)

## Quick Start

### 1. Start Docker Desktop

Make sure Docker Desktop is running on your system. You can download it from [docker.com](https://www.docker.com/products/docker-desktop/).

### 2. Clone and Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd timesheet-management-system

# Install root dependencies
npm install
```

### 3. Start the Application

#### Option A: Using the startup script (Recommended)

**On Windows:**
```bash
start.bat
```

**On macOS/Linux:**
```bash
chmod +x start.sh
./start.sh
```

#### Option B: Manual startup

```bash
# Start all services
npm run dev

# Or start in detached mode
npm run dev:detached
```

### 4. Access the Application

Once all services are running, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/docs
- **Health Check**: http://localhost:5000/health

## Default Login Credentials

The system comes with pre-seeded data including test users:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password123 |
| Employee | employee@example.com | password123 |
| Client | client@example.com | password123 |

## Development Commands

### Docker Commands

```bash
# Start all services
npm run dev

# Start in detached mode
npm run dev:detached

# Stop all services
npm run stop

# Stop and remove volumes
npm run stop:volumes

# View logs
npm run logs

# View specific service logs
npm run logs:frontend
npm run logs:backend
npm run logs:postgres

# Clean up everything
npm run clean
```

### Database Commands

```bash
# Run Prisma migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with test data
npm run db:seed
```

### Direct Docker Commands

```bash
# Build and start services
docker-compose up --build

# Start in detached mode
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Execute commands in containers
docker-compose exec backend npm run db:migrate
docker-compose exec frontend npm run build
```

## Troubleshooting

### Docker Issues

1. **Docker Desktop not running**
   - Start Docker Desktop application
   - Wait for it to fully initialize

2. **Port conflicts**
   - Check if ports 3000, 5000, or 5432 are already in use
   - Stop conflicting services or change ports in docker-compose.yml

3. **Permission issues (Linux/macOS)**
   - Make sure your user is in the docker group
   - Or run with sudo (not recommended for development)

### Database Issues

1. **Database connection errors**
   - Wait for PostgreSQL to fully start (usually 10-15 seconds)
   - Check if the database container is running: `docker-compose ps`

2. **Migration errors**
   - Reset the database: `npm run db:reset`
   - Or manually drop and recreate the database

### Frontend Issues

1. **Build errors**
   - Clear node_modules: `docker-compose exec frontend rm -rf node_modules`
   - Rebuild: `docker-compose up --build frontend`

2. **Hot reload not working**
   - Check if the volume mounts are working correctly
   - Restart the frontend container

## Project Structure

```
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Zustand state management
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static assets
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── types/          # TypeScript type definitions
│   └── prisma/             # Database schema and migrations
├── database/               # Database initialization scripts
├── docker-compose.yml      # Docker services configuration
└── package.json           # Root package.json with scripts
```

## Next Steps

1. **Explore the API**: Visit http://localhost:5000/api/docs
2. **Test the application**: Login with the default credentials
3. **Review the code**: Check the source code structure
4. **Customize**: Modify the application to fit your needs
5. **Deploy**: When ready, deploy to your VPS

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the logs: `npm run logs`
3. Check the API documentation: http://localhost:5000/api/docs
4. Create an issue in the repository

Happy coding! 🚀
