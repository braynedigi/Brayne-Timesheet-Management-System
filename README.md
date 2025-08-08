# Timesheet Management System

A comprehensive timesheet management system with role-based access control for companies managing multiple clients and projects.

## 🎯 Features

### Core Functionality
- **Timesheet Entries**: Track task name, hours worked, date, type, and project
- **Multi-Client Support**: Manage multiple clients with multiple projects each
- **Role-Based Access**: Admin, Employee, and Client roles with appropriate permissions
- **Advanced Filtering**: Filter by date range, client, project, and employee
- **Export Capabilities**: CSV and PDF exports for reports and invoicing

### Dashboards
- **Admin Dashboard**: Full system management, user management, reports
- **Employee Dashboard**: Personal timesheet management
- **Client Dashboard**: Project-specific timesheet viewing

### Security
- JWT-based authentication with refresh tokens
- Role-based route protection
- Secure API endpoints
- Input validation and sanitization

## 🏗️ Architecture

```
├── frontend/          # React + TypeScript + Tailwind CSS
├── backend/           # Node.js + Express + Prisma
├── database/          # PostgreSQL data and init scripts
└── docker-compose.yml # Local development setup
```

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development without Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd timesheet-management-system
   ```

2. **Start all services**
   ```bash
   npm run dev
   ```
   This will:
   - Build and start PostgreSQL database
   - Build and start the backend API
   - Build and start the frontend React app
   - Set up all necessary networks and volumes

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs

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

# Database operations
npm run db:migrate    # Run Prisma migrations
npm run db:generate   # Generate Prisma client
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database with test data
```

## 📊 Database Schema

### Core Entities
- **Users**: Admin, Employee, Client roles
- **Clients**: Company clients
- **Projects**: Sub-projects under clients
- **Timesheets**: Time entries with task details
- **EmployeeRates**: Internal hourly rates (admin only)

### Relationships
- Client → Projects (1:many)
- Project → Timesheets (1:many)
- User → Timesheets (1:many)
- User → EmployeeRates (1:1, employees only)

## 🔐 Authentication & Authorization

### Roles & Permissions

| Role | Can View | Can Edit | Access Level |
|------|----------|----------|--------------|
| **Admin** | All data | All data | Full system access |
| **Employee** | Own timesheets | Own timesheets | Personal data only |
| **Client** | Project timesheets | View only | Project-specific data |

### Protected Routes
- `/admin/*` - Admin only
- `/employee/*` - Employee only  
- `/client/*` - Client only
- `/api/rates` - Admin only

## 🛠️ Development

### Local Development (without Docker)
```bash
# Install dependencies
npm run install:all

# Start backend
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm start
```

### Database Management
```bash
# Using Docker
npm run db:migrate
npm run db:studio

# Or directly
docker-compose exec backend npx prisma studio
```

## 📝 API Documentation

The API documentation is available at `/api/docs` when running the backend server.

### Key Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/timesheets` - Get timesheets (filtered by role)
- `POST /api/timesheets` - Create timesheet entry
- `GET /api/clients` - Get clients (admin only)
- `GET /api/projects` - Get projects
- `GET /api/rates` - Get employee rates (admin only)

## 🧪 Testing

```bash
# Run backend tests
docker-compose exec backend npm test

# Run frontend tests
docker-compose exec frontend npm test
```

## 📦 Production Deployment

### VPS Deployment
1. Copy the project to your VPS
2. Update environment variables for production
3. Use production Dockerfiles
4. Set up reverse proxy (Nginx)
5. Configure SSL certificates

### Environment Variables
Create `.env` files for production:
- `backend/.env.production`
- `frontend/.env.production`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions, please contact the development team.
