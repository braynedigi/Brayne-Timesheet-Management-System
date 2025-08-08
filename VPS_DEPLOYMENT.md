# VPS Deployment Guide

This guide explains how to deploy the Timesheet Management System on a VPS that supports Docker but not Docker Compose.

## Prerequisites

- VPS with Docker installed
- SSH access to your VPS
- At least 2GB RAM and 10GB storage

## Quick Start

1. **Upload your code to the VPS**
   ```bash
   # On your local machine, zip the project
   zip -r timesheet.zip . -x "node_modules/*" ".git/*" "*.log"
   
   # Upload to VPS
   scp timesheet.zip user@your-vps-ip:/home/user/
   
   # SSH into your VPS
   ssh user@your-vps-ip
   
   # Extract the project
   cd /home/user
   unzip timesheet.zip -d timesheet
   cd timesheet
   ```

2. **Make the startup script executable**
   ```bash
   chmod +x start-vps.sh
   ```

3. **Run the startup script**
   ```bash
   ./start-vps.sh
   ```

## Manual Deployment

If you prefer to deploy services individually:

### 1. Start Database
```bash
cd database
docker build -t timesheet-db .
docker run -d \
    --name timesheet-postgres \
    --network timesheet-network \
    -p 5432:5432 \
    -v postgres_data:/var/lib/postgresql/data \
    timesheet-db
cd ..
```

### 2. Start Backend
```bash
cd backend
docker build -t timesheet-backend .
docker run -d \
    --name timesheet-backend \
    --network timesheet-network \
    -p 5000:5000 \
    -e DATABASE_URL=postgresql://timesheet_user:timesheet_password@timesheet-postgres:5432/timesheet_db \
    -e JWT_SECRET=your-super-secret-jwt-key-change-in-production \
    -e JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production \
    -e PORT=5000 \
    timesheet-backend
cd ..
```

### 3. Start Frontend
```bash
cd frontend
docker build -t timesheet-frontend .
docker run -d \
    --name timesheet-frontend \
    --network timesheet-network \
    -p 3000:3000 \
    -e REACT_APP_API_URL=http://localhost:5000/api \
    timesheet-frontend
cd ..
```

## Access Your Application

Once deployed, you can access:

- **Frontend**: http://your-vps-ip:3000
- **Backend API**: http://your-vps-ip:5000
- **API Documentation**: http://your-vps-ip:5000/api/docs
- **Health Check**: http://your-vps-ip:5000/health

## Default Login Credentials

- **Admin**: admin@example.com / password123
- **Employee**: employee@example.com / password123
- **Client**: client@example.com / password123

## Useful Commands

### View Logs
```bash
# Frontend logs
docker logs timesheet-frontend

# Backend logs
docker logs timesheet-backend

# Database logs
docker logs timesheet-postgres
```

### Stop Services
```bash
docker stop timesheet-frontend timesheet-backend timesheet-postgres
```

### Remove Services
```bash
docker rm timesheet-frontend timesheet-backend timesheet-postgres
```

### Restart Services
```bash
docker restart timesheet-frontend timesheet-backend timesheet-postgres
```

## Environment Variables

You can customize the deployment by setting environment variables:

### Backend Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens
- `PORT`: Backend server port (default: 5000)

### Frontend Environment Variables
- `REACT_APP_API_URL`: Backend API URL

## Troubleshooting

### White Screen Issue Fixed
The white screen issue in the System tab has been fixed by adding proper error handling and optional chaining for settings.

### Database Connection Issues
If the backend can't connect to the database:
1. Check if the database container is running: `docker ps`
2. Check database logs: `docker logs timesheet-postgres`
3. Ensure the network exists: `docker network ls`

### Port Conflicts
If ports 3000 or 5000 are already in use:
1. Stop conflicting services
2. Or modify the port mappings in the docker run commands

### Memory Issues
If you encounter memory issues:
1. Increase your VPS RAM
2. Or add swap space: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`

## Security Notes

1. Change default passwords in production
2. Update JWT secrets
3. Use HTTPS in production
4. Configure firewall rules
5. Regular security updates

## Backup

To backup your data:
```bash
# Backup database
docker exec timesheet-postgres pg_dump -U timesheet_user timesheet_db > backup.sql

# Backup volumes
docker run --rm -v timesheet_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```
