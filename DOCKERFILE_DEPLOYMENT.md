# Dockerfile-Only Deployment Guide

## 🎯 **Simplified Deployment Approach**

This guide focuses on deploying your timesheet application using **ONLY the Dockerfile**, eliminating platform detection issues and complex configurations.

## 🚀 **Quick Deploy (Recommended)**

### **Option 1: Simple Script (Easiest)**
```bash
# Windows
.\deploy-simple.bat

# Linux/Mac
./deploy-simple.sh
```

### **Option 2: Manual Docker Commands**
```bash
# Build the image
docker build -t brayne-timesheet .

# Run the container
docker run -d \
  --name brayne-timesheet \
  -p 3000:3000 \
  -p 5000:5000 \
  --restart unless-stopped \
  brayne-timesheet
```

## 🔧 **What the Dockerfile Does**

### **Multi-Stage Build**
- **Base Stage**: Installs dependencies and builds frontend
- **Production Stage**: Creates optimized production image
- **Development Stage**: Optional development environment

### **Platform Detection Prevention**
The Dockerfile explicitly sets environment variables to prevent Laravel detection:
```dockerfile
ENV PLATFORM=nodejs
ENV FRAMEWORK=express
ENV LANGUAGE=javascript
ENV RUNTIME=node
```

### **Comprehensive Startup**
- Runs database migrations
- Starts backend API server
- Starts frontend server
- Health checks for both services

## 📋 **Deployment Steps**

### **1. Ensure Docker is Running**
```bash
docker --version
docker info
```

### **2. Build the Image**
```bash
docker build -t brayne-timesheet .
```

### **3. Run the Container**
```bash
docker run -d \
  --name brayne-timesheet \
  -p 3000:3000 \
  -p 5000:5000 \
  --restart unless-stopped \
  brayne-timesheet
```

### **4. Verify Deployment**
```bash
# Check container status
docker ps

# View logs
docker logs -f brayne-timesheet

# Test endpoints
curl http://localhost:3000
curl http://localhost:5000/api/health
```

## 🌐 **Access Your Application**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🔍 **Troubleshooting**

### **Build Issues**
```bash
# Clean build (no cache)
docker build --no-cache -t brayne-timesheet .

# Check build context
docker build --progress=plain -t brayne-timesheet .
```

### **Runtime Issues**
```bash
# Check container logs
docker logs brayne-timesheet

# Enter container for debugging
docker exec -it brayne-timesheet sh

# Check container resources
docker stats brayne-timesheet
```

### **Port Conflicts**
```bash
# Check what's using the ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# Use different ports
docker run -d \
  --name brayne-timesheet \
  -p 3001:3000 \
  -p 5001:5000 \
  --restart unless-stopped \
  brayne-timesheet
```

## 📊 **Container Management**

### **Basic Commands**
```bash
# Start container
docker start brayne-timesheet

# Stop container
docker stop brayne-timesheet

# Restart container
docker restart brayne-timesheet

# Remove container
docker rm brayne-timesheet

# Remove image
docker rmi brayne-timesheet
```

### **Monitoring**
```bash
# View real-time logs
docker logs -f brayne-timesheet

# Check resource usage
docker stats brayne-timesheet

# View container details
docker inspect brayne-timesheet
```

## 🔒 **Security Considerations**

### **Environment Variables**
```bash
# Run with custom environment
docker run -d \
  --name brayne-timesheet \
  -p 3000:3000 \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  --restart unless-stopped \
  brayne-timesheet
```

### **Volume Mounts**
```bash
# Persist uploads and logs
docker run -d \
  --name brayne-timesheet \
  -p 3000:3000 \
  -p 5000:5000 \
  -v ./uploads:/app/backend/uploads \
  -v ./logs:/app/backend/logs \
  --restart unless-stopped \
  brayne-timesheet
```

## 🚀 **Production Deployment**

### **With Environment File**
```bash
# Create .env file
cp env.template .env
# Edit .env with your values

# Run with environment file
docker run -d \
  --name brayne-timesheet \
  -p 3000:3000 \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  brayne-timesheet
```

### **With Database**
```bash
# Run PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_DB=timesheet_db \
  -e POSTGRES_USER=timesheet_user \
  -e POSTGRES_PASSWORD=timesheet_password \
  -p 5432:5432 \
  postgres:15-alpine

# Run application with database
docker run -d \
  --name brayne-timesheet \
  -p 3000:3000 \
  -p 5000:5000 \
  -e DATABASE_URL=postgresql://timesheet_user:timesheet_password@host.docker.internal:5432/timesheet_db \
  --restart unless-stopped \
  brayne-timesheet
```

## ✅ **Success Indicators**

After successful deployment:
- ✅ Container is running (`docker ps`)
- ✅ Frontend accessible at http://localhost:3000
- ✅ Backend API accessible at http://localhost:5000
- ✅ Health check passes
- ✅ No Laravel/PrivateKey errors in logs

## 🎯 **Why This Approach Works**

1. **No Platform Dependencies**: Uses only Docker, no platform-specific configs
2. **Explicit Environment Variables**: Prevents Laravel detection
3. **Self-Contained**: Everything needed is in the Dockerfile
4. **Portable**: Works on any system with Docker
5. **Debuggable**: Easy to troubleshoot and modify

---

**This approach eliminates platform detection issues by using only the Dockerfile and Docker commands. No more Laravel errors! 🐳✨**
