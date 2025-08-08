import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/authService';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminData = {
    email: 'admin@timesheet.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as const,
  };

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email },
    });

    if (!existingAdmin) {
      const hashedPassword = await AuthService.hashPassword(adminData.password);
      
      const admin = await prisma.user.create({
        data: {
          email: adminData.email,
          password: hashedPassword,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          role: adminData.role,
          isActive: true,
        },
      });

      console.log('✅ Admin user created:', admin.email);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create sample employee
    const employeeData = {
      email: 'employee@timesheet.com',
      password: 'employee123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'EMPLOYEE' as const,
    };

    const existingEmployee = await prisma.user.findUnique({
      where: { email: employeeData.email },
    });

    if (!existingEmployee) {
      const hashedPassword = await AuthService.hashPassword(employeeData.password);
      
      const employee = await prisma.user.create({
        data: {
          email: employeeData.email,
          password: hashedPassword,
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          role: employeeData.role,
          isActive: true,
        },
      });

      console.log('✅ Employee user created:', employee.email);
    } else {
      console.log('ℹ️  Employee user already exists');
    }

    // Create sample client
    const clientData = {
      email: 'client@timesheet.com',
      password: 'client123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'CLIENT' as const,
    };

    const existingClient = await prisma.user.findUnique({
      where: { email: clientData.email },
    });

    if (!existingClient) {
      const hashedPassword = await AuthService.hashPassword(clientData.password);
      
      const client = await prisma.user.create({
        data: {
          email: clientData.email,
          password: hashedPassword,
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          role: clientData.role,
          isActive: true,
        },
      });

      console.log('✅ Client user created:', client.email);
    } else {
      console.log('ℹ️  Client user already exists');
    }

    // Create sample clients
    const clients = [
      {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-0123',
        address: '123 Business St, City, State 12345',
      },
      {
        name: 'TechStart Inc',
        email: 'hello@techstart.com',
        phone: '+1-555-0456',
        address: '456 Innovation Ave, Tech City, TC 67890',
      },
    ];

    for (const clientData of clients) {
      const existingClient = await prisma.client.findUnique({
        where: { email: clientData.email },
      });

      if (!existingClient) {
        const client = await prisma.client.create({
          data: clientData,
        });
        console.log('✅ Client created:', client.name);
      } else {
        console.log('ℹ️  Client already exists:', clientData.name);
      }
    }

    // Create sample projects
    const projects = [
      {
        name: 'Website Redesign',
        description: 'Complete redesign of the company website',
        clientId: '', // Will be set below
      },
      {
        name: 'Mobile App Development',
        description: 'Development of a new mobile application',
        clientId: '', // Will be set below
      },
    ];

    const allClients = await prisma.client.findMany();
    
    for (let i = 0; i < projects.length && i < allClients.length; i++) {
      const projectData = projects[i];
      projectData.clientId = allClients[i].id;

      const existingProject = await prisma.project.findFirst({
        where: {
          name: projectData.name,
          clientId: projectData.clientId,
        },
      });

      if (!existingProject) {
        const project = await prisma.project.create({
          data: projectData,
        });
        console.log('✅ Project created:', project.name);
      } else {
        console.log('ℹ️  Project already exists:', projectData.name);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('Admin: admin@timesheet.com / admin123');
    console.log('Employee: employee@timesheet.com / employee123');
    console.log('Client: client@timesheet.com / client123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
