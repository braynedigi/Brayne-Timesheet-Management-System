# Docker Setup Guide for Brayne Timesheet Management System

This guide will help you quickly set up and run the Brayne Timesheet Management System using Docker Compose.

## 🚀 Quick Start (Recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/braynedigi/Brayne-Timesheet-Management-System.git
cd Brayne-Timesheet-Management-System
```

### 2. Start the Application
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory with your configuration:

```bash
# Copy the example file
cp .env.example .env

# Edit the file with your values
nano .env
```

**Required Environment Variables:**
- `JWT_SECRET`: A secure random string for JWT tokens
- `JWT_REFRESH_SECRET`: A secure random string for refresh tokens
- `EMAIL_USER`: Your email for notifications
- `EMAIL_PASS`: Your email password or app password

**Optional Environment Variables:**
- `NODE_ENV`: Set to `production` for production mode
- `CORS_ORIGIN`: Allowed origins for CORS

### Generate Secure Secrets
```bash
# Generate JWT secrets
openssl rand -base64 32
openssl rand -base64 32
```

## 🐳 Docker Commands

### Basic Operations
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Development Mode
```bash
# Start with development overrides (hot reloading)
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Or use the development script
./start.sh
```

### Production Mode
```bash
# Start with production profile (includes nginx)
docker-compose --profile production up -d
```

### Database Operations
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U timesheet_user -d timesheet_db

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed the database
docker-compose exec backend npm run db:seed

# Reset database
docker-compose exec backend npm run db:reset
```

### Maintenance
```bash
# Update images
docker-compose pull

# Rebuild containers
docker-compose build --no-cache

# Remove all containers and volumes
docker-compose down -v

# Clean up unused images
docker system prune -a
```

## 📊 Service Health Checks

The Docker Compose setup includes health checks for all services:

- **PostgreSQL**: Checks database connectivity
- **Backend**: Verifies API endpoint availability
- **Frontend**: Confirms web application is running

## 🔒 Security Considerations

### Production Deployment
1. **Change default passwords** in the `.env` file
2. **Use strong JWT secrets** (32+ characters)
3. **Configure proper CORS origins**
4. **Set up SSL/TLS** with nginx
5. **Use environment variables** for sensitive data

### Environment Variables
```bash
# Production .env example
NODE_ENV=production
JWT_SECRET=your-very-long-and-secure-secret-key-here
JWT_REFRESH_SECRET=another-very-long-and-secure-secret-key-here
EMAIL_USER=your-production-email@company.com
EMAIL_PASS=your-app-password
CORS_ORIGIN=https://yourdomain.com
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000
netstat -tulpn | grep :5432

# Kill the process or change ports in docker-compose.yml
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify database is running
docker-compose exec postgres pg_isready -U timesheet_user -d timesheet_db

# Reset database if needed
docker-compose down -v
docker-compose up -d
```

#### 3. Backend Build Issues
```bash
# Rebuild backend
docker-compose build --no-cache backend

# Check Node.js version compatibility
docker-compose exec backend node --version
```

#### 4. Frontend Build Issues
```bash
# Rebuild frontend
docker-compose build --no-cache frontend

# Check build logs
docker-compose logs frontend
```

### Log Analysis
```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

## 📁 File Structure

```
├── docker-compose.yml              # Main Docker Compose file
├── docker-compose.override.yml     # Development overrides
├── .env.example                    # Environment variables template
├── backend/                        # Backend application
│   ├── Dockerfile                  # Production backend image
│   └── Dockerfile.dev             # Development backend image
├── frontend/                       # Frontend application
│   ├── Dockerfile                  # Production frontend image
│   └── Dockerfile.dev             # Development frontend image
├── database/                       # Database initialization
│   └── init.sql                   # PostgreSQL init script
└── nginx.conf                      # Nginx configuration
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Migrations
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate
```

### Backup and Restore
```bash
# Backup database
docker-compose exec postgres pg_dump -U timesheet_user timesheet_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U timesheet_user -d timesheet_db < backup.sql
```

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables are set correctly
3. Ensure ports are not in use by other services
4. Check Docker and Docker Compose versions
5. Create an issue on GitHub with logs and error details

## 🎯 Next Steps

After successful setup:

1. **Access the application** at http://localhost:3000
2. **Login** with default credentials:
   - Admin: admin@timesheet.com / admin123
   - Employee: employee@timesheet.com / employee123
   - Client: client@timesheet.com / client123
3. **Configure your settings** in the admin panel
4. **Customize branding** and preferences
5. **Set up email notifications**

---

**Happy Timesheet Management! 🎉**
