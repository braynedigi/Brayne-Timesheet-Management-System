import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🧪 Creating comprehensive test data...');

  try {
    // Create additional users
    const additionalUsers = [
      {
        email: 'john.doe@company.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.EMPLOYEE,
      },
      {
        email: 'jane.smith@company.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.EMPLOYEE,
      },
      {
        email: 'mike.johnson@company.com',
        password: 'password123',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: UserRole.ADMIN,
      },
    ];

    for (const userData of additionalUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
            isActive: true,
          },
        });
        console.log(`✅ Created user: ${userData.firstName} ${userData.lastName}`);
      } else {
        console.log(`ℹ️  User already exists: ${userData.email}`);
      }
    }

    // Create additional clients
    const additionalClients = [
      {
        name: 'Global Solutions Ltd',
        email: 'contact@globalsolutions.com',
        phone: '+1-555-0101',
        address: '123 Business Ave, Suite 100, New York, NY 10001',
      },
      {
        name: 'Innovation Corp',
        email: 'hello@innovationcorp.com',
        phone: '+1-555-0202',
        address: '456 Tech Street, San Francisco, CA 94102',
      },
      {
        name: 'Startup Ventures',
        email: 'info@startupventures.com',
        phone: '+1-555-0303',
        address: '789 Innovation Blvd, Austin, TX 73301',
      },
    ];

    for (const clientData of additionalClients) {
      const existingClient = await prisma.client.findUnique({
        where: { email: clientData.email },
      });

      if (!existingClient) {
        await prisma.client.create({
          data: {
            ...clientData,
            isActive: true,
          },
        });
        console.log(`✅ Created client: ${clientData.name}`);
      } else {
        console.log(`ℹ️  Client already exists: ${clientData.email}`);
      }
    }

    // Get all users and clients for project creation
    const users = await prisma.user.findMany();
    const clients = await prisma.client.findMany();

    // Create additional projects
    const additionalProjects = [
      {
        name: 'E-commerce Platform',
        description: 'Full-stack e-commerce solution with payment integration',
        clientId: clients[0]?.id,
      },
      {
        name: 'CRM System',
        description: 'Customer relationship management system with analytics',
        clientId: clients[1]?.id,
      },
      {
        name: 'Mobile Banking App',
        description: 'Cross-platform mobile banking application',
        clientId: clients[2]?.id,
      },
      {
        name: 'Data Analytics Dashboard',
        description: 'Real-time data visualization and reporting platform',
        clientId: clients[0]?.id,
      },
      {
        name: 'API Integration',
        description: 'Third-party API integration and automation',
        clientId: clients[1]?.id,
      },
    ];

    for (const projectData of additionalProjects) {
      if (projectData.clientId) {
        const existingProject = await prisma.project.findFirst({
          where: {
            name: projectData.name,
            clientId: projectData.clientId,
          },
        });

        if (!existingProject) {
          await prisma.project.create({
            data: projectData,
          });
          console.log(`✅ Created project: ${projectData.name}`);
        } else {
          console.log(`ℹ️  Project already exists: ${projectData.name}`);
        }
      }
    }

    // Get all projects for timesheet creation
    const projects = await prisma.project.findMany();

    // Create realistic timesheet entries for the past 30 days
    const timesheetTypes = ['WORK', 'MEETING', 'RESEARCH', 'TRAINING', 'OTHER'];

    // Generate timesheet entries for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Skip weekends for some entries to make it realistic
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Sundays and Saturdays

      // Create 2-4 timesheet entries per day
      const entriesPerDay = Math.floor(Math.random() * 3) + 2;

      for (let j = 0; j < entriesPerDay; j++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const project = projects[Math.floor(Math.random() * projects.length)];
        const type = timesheetTypes[Math.floor(Math.random() * timesheetTypes.length)];
        const hours = Math.floor(Math.random() * 4) + 1; // 1-4 hours per entry

        if (user && project) {
          await prisma.timesheet.create({
            data: {
              userId: user.id,
              projectId: project.id,
              date: date,
              hoursWorked: hours,
              type: type as any,
              taskName: `Work on ${project.name} - ${type.toLowerCase()}`,
              description: `Detailed work on ${project.name} project`,
            },
          });
        }
      }
    }

    console.log('✅ Created realistic timesheet entries for the past 30 days');

    // Create some recent timesheet entries for today and yesterday
    const recentDates = [new Date(), new Date(Date.now() - 24 * 60 * 60 * 1000)];

    for (const date of recentDates) {
      const entriesPerDay = Math.floor(Math.random() * 4) + 3; // 3-6 entries per day

      for (let j = 0; j < entriesPerDay; j++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const project = projects[Math.floor(Math.random() * projects.length)];
        const type = timesheetTypes[Math.floor(Math.random() * timesheetTypes.length)];
        const hours = Math.floor(Math.random() * 3) + 1; // 1-3 hours per entry

        if (user && project) {
          await prisma.timesheet.create({
            data: {
              userId: user.id,
              projectId: project.id,
              date: date,
              hoursWorked: hours,
              type: type as any,
              taskName: `Recent work on ${project.name} - ${type.toLowerCase()}`,
              description: `Recent detailed work on ${project.name} project`,
            },
          });
        }
      }
    }

    console.log('✅ Created recent timesheet entries for today and yesterday');

    console.log('\n🎉 Comprehensive test data creation completed!');
    console.log('\n📋 Test Data Summary:');
    console.log(`👥 Users: ${users.length} (including additional test users)`);
    console.log(`🏢 Clients: ${clients.length} (including additional test clients)`);
    console.log(`📁 Projects: ${projects.length} (including additional test projects)`);
    
    const timesheetCount = await prisma.timesheet.count();
    console.log(`⏰ Timesheet Entries: ${timesheetCount} (realistic data for past 30 days)`);

    console.log('\n🔑 Test Login Credentials:');
    console.log('Admin: admin@timesheet.com / admin123');
    console.log('Employee: employee@timesheet.com / employee123');
    console.log('Client: client@timesheet.com / client123');
    console.log('John Doe: john.doe@company.com / password123');
    console.log('Jane Smith: jane.smith@company.com / password123');
    console.log('Mike Johnson: mike.johnson@company.com / password123');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
