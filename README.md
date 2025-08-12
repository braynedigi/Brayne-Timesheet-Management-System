# Brayne Timesheet Management System

A modern, full-stack timesheet management system built with React, Node.js, and PostgreSQL. Features include user authentication, project management, time tracking, reporting, and customizable settings.

## 🚀 Features

- **User Management**: Admin, Employee, and Client roles with different permissions
- **Time Tracking**: Easy timesheet entry with project and task management
- **Project Management**: Create and manage projects with client assignments
- **Reporting**: Comprehensive analytics and reporting dashboard
- **Customization**: Branding, notifications, and system settings
- **Multi-currency Support**: Custom currency management
- **Email Integration**: Configurable email notifications
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: User preference support

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **React Query** for data fetching
- **Lucide React** for icons

### Backend
- **Node.js** with TypeScript
- **Express.js** framework
- **Prisma** ORM for database management
- **PostgreSQL** database
- **JWT** for authentication
- **bcrypt** for password hashing
- **Nodemailer** for email functionality

### Infrastructure
- **Docker** containerization
- **Docker Compose** for local development
- **Individual Dockerfiles** for VPS deployment

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL (if running without Docker)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended for Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/braynedigi/Brayne-Timesheet-Management-System.git
   cd Brayne-Timesheet-Management-System
   ```

2. **Start the application**
   ```bash
   # Windows
   .\start.bat
   
   # Linux/Mac
   ./start.sh
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs

### Option 2: VPS Deployment (Production)

For VPS deployment without Docker Compose, see [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md)

## 🔐 Default Login Credentials

- **Admin**: admin@timesheet.com / admin123
- **Employee**: employee@timesheet.com / employee123
- **Client**: client@timesheet.com / client123

## 📁 Project Structure

```
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── scripts/        # Database scripts
│   ├── prisma/             # Database schema and migrations
│   └── Dockerfile          # Backend container
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores
│   │   └── contexts/       # React contexts
│   └── Dockerfile          # Frontend container
├── database/               # Database initialization
├── docker-compose.yml      # Development environment
├── start-vps.sh           # VPS deployment script
└── VPS_DEPLOYMENT.md      # VPS deployment guide
```

## 🔧 Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Database Management

```bash
# Generate Prisma client
cd backend
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run db:seed
```

## 🐳 Docker Commands

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production (VPS)
```bash
# Build and start services
./start-vps.sh

# View logs
docker logs timesheet-frontend
docker logs timesheet-backend
docker logs timesheet-postgres

# Stop services
docker stop timesheet-frontend timesheet-backend timesheet-postgres
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Timesheets
- `GET /api/timesheets` - Get timesheets
- `POST /api/timesheets` - Create timesheet entry
- `PUT /api/timesheets/:id` - Update timesheet
- `DELETE /api/timesheets/:id` - Delete timesheet

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting (configurable)

## 🎨 Customization

The system supports extensive customization:

- **Branding**: Logo, colors, company name
- **Notifications**: Email and push notifications
- **Currencies**: Custom currency management
- **User Preferences**: Theme, language, timezone
- **System Settings**: Backup, maintenance mode, logging

## 📈 Reporting & Analytics

- Time tracking analytics
- Project performance metrics
- User productivity reports
- Client billing reports
- Export functionality (CSV, PDF)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md) for deployment help
- Review the API documentation at http://localhost:5000/api/docs

## 🔄 Updates

- **Prisma**: Update available from 5.22.0 to 6.13.0
- **Dependencies**: Regular security updates recommended
- **Features**: New features added regularly

---

**Built with ❤️ by Brayne Digital**
