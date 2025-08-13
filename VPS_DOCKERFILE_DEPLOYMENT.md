# 🐳 VPS Deployment Guide - Dockerfile Only

This guide provides step-by-step instructions for deploying the Brayne Timesheet Management System on a VPS that only supports Dockerfile (no docker-compose).

## 📋 Prerequisites

- **VPS with Docker installed**
- **Git access to clone the repository**
- **Basic knowledge of Docker commands**
- **Ports 80, 3000, 5000, and 5432 available**

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/braynedigi/Brayne-Timesheet-Management-System.git
   cd Brayne-Timesheet-Management-System
   ```

2. **Make deployment script executable (Linux/Mac):**
   ```bash
   chmod +x deploy-vps.sh
   ```

3. **Run the deployment script:**
   ```bash
   # Linux/Mac
   ./deploy-vps.sh
   
   # Windows
   deploy-vps.bat
   ```

4. **Follow the interactive prompts to choose your deployment method**

### Option 2: Manual Deployment

If you prefer manual deployment, follow the steps below.

## 🏗️ Deployment Methods

### Method 1: Combined Deployment (Single Container)

**Pros:**
- Simpler to manage
- Single container to monitor
- Easier backup and restore

**Cons:**
- Less scalable
- Both services restart together
- Larger container size

**Usage:**
```bash
# Build the combined image
docker build -f Dockerfile.vps -t brayne-timesheet-combined .

# Run the container
docker run -d \
  --name brayne-timesheet-combined \
  --network brayne-timesheet-network \
  -e DATABASE_URL="postgresql://timesheet_user:timesheet_password@brayne-timesheet-postgres:5432/timesheet" \
  -e NODE_ENV=production \
  -e JWT_SECRET=your_secure_jwt_secret \
  -e PORT=5000 \
  -p 3000:3000 \
  -p 5000:5000 \
  brayne-timesheet-combined
```

### Method 2: Separate Deployment (Frontend + Backend)

**Pros:**
- Better scalability
- Independent service management
- Smaller individual containers
- Better resource isolation

**Cons:**
- More complex to manage
- Multiple containers to monitor
- Network configuration required

**Usage:**
```bash
# Build frontend image
docker build -f Dockerfile.frontend -t brayne-timesheet-frontend .

# Build backend image
docker build -f Dockerfile.backend -t brayne-timesheet-backend .

# Run backend container
docker run -d \
  --name brayne-timesheet-backend \
  --network brayne-timesheet-network \
  -e DATABASE_URL="postgresql://timesheet_user:timesheet_password@brayne-timesheet-postgres:5432/timesheet" \
  -e NODE_ENV=production \
  -e JWT_SECRET=your_secure_jwt_secret \
  -e PORT=5000 \
  -p 5000:5000 \
  brayne-timesheet-backend

# Run frontend container
docker run -d \
  --name brayne-timesheet-frontend \
  --network brayne-timesheet-network \
  -p 80:80 \
  brayne-timesheet-frontend
```

## 🗄️ Database Setup

### PostgreSQL Container

```bash
# Create PostgreSQL container
docker run -d \
  --name brayne-timesheet-postgres \
  --network brayne-timesheet-network \
  -e POSTGRES_DB=timesheet \
  -e POSTGRES_USER=timesheet_user \
  -e POSTGRES_PASSWORD=timesheet_password \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
```

### Network Setup

```bash
# Create Docker network
docker network create brayne-timesheet-network
```

## ⚙️ Environment Variables

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | Environment mode | `production` |
| `JWT_SECRET` | JWT signing secret | `your_secure_secret_here` |
| `PORT` | Backend server port | `5000` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGIN` | CORS allowed origins | `*` |
| `RATE_LIMIT_WINDOW` | Rate limiting window (ms) | `900000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

## 🔧 Configuration Files

### Nginx Configuration (Frontend)

The `nginx.conf` file is automatically copied to the frontend container and includes:

- **API Proxy**: Routes `/api/*` requests to backend
- **SPA Support**: Handles React Router navigation
- **Gzip Compression**: Optimizes file delivery
- **Security Headers**: Protects against common attacks
- **Static Asset Caching**: Improves performance

### Customizing Nginx

To customize nginx configuration:

1. Modify `nginx.conf`
2. Rebuild the frontend image
3. Restart the frontend container

## 📊 Health Checks

All containers include health checks:

```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{.State.Health}}' container_name
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :5000

# Kill the process or change the port
docker run -p 5001:5000 ...
```

#### 2. Database Connection Failed
```bash
# Check PostgreSQL container
docker logs brayne-timesheet-postgres

# Verify network connectivity
docker network inspect brayne-timesheet-network
```

#### 3. Frontend Can't Connect to Backend
```bash
# Check backend logs
docker logs brayne-timesheet-backend

# Verify API endpoint
curl http://localhost:5000/api/health
```

#### 4. Permission Denied
```bash
# Fix file permissions
chmod +x deploy-vps.sh

# Run as root if necessary
sudo ./deploy-vps.sh
```

### Debug Commands

```bash
# View container logs
docker logs -f container_name

# Execute commands in container
docker exec -it container_name /bin/sh

# Inspect container
docker inspect container_name

# Check resource usage
docker stats
```

## 🔄 Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart containers
./deploy-vps.sh cleanup
./deploy-vps.sh
```

### Backup and Restore

```bash
# Backup database
docker exec brayne-timesheet-postgres pg_dump -U timesheet_user timesheet > backup.sql

# Restore database
docker exec -i brayne-timesheet-postgres psql -U timesheet_user timesheet < backup.sql

# Backup application data
docker run --rm -v brayne-timesheet_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

### Monitoring

```bash
# View real-time logs
./deploy-vps.sh logs

# Check status
./deploy-vps.sh status

# Monitor resources
docker stats --no-stream
```

## 🌐 Production Considerations

### Security

1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Enable HTTPS with reverse proxy**
4. **Restrict database access**
5. **Regular security updates**

### Performance

1. **Enable gzip compression**
2. **Use CDN for static assets**
3. **Implement caching strategies**
4. **Monitor resource usage**
5. **Scale horizontally if needed**

### Backup Strategy

1. **Automated database backups**
2. **Application data backups**
3. **Configuration backups**
4. **Disaster recovery plan**
5. **Regular backup testing**

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section**
2. **Review container logs**
3. **Verify configuration**
4. **Check network connectivity**
5. **Create an issue on GitHub**

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**Happy Deploying! 🚀**

For more information, visit: [Brayne Timesheet Management System](https://github.com/braynedigi/Brayne-Timesheet-Management-System)
