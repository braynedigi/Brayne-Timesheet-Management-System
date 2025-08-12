import { PrismaClient, Project, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateProjectData {
  name: string;
  description?: string;
  clientId: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  clientId?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export class ProjectService {
  // Create new project
  static async createProject(data: CreateProjectData): Promise<Project> {
    // Validate that the client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Check if project with same name exists for this client
    const existingProject = await prisma.project.findFirst({
      where: {
        name: data.name,
        clientId: data.clientId,
      },
    });

    if (existingProject) {
      throw new Error('A project with this name already exists for this client');
    }

    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        category: data.category || 'DEV',
        status: (data.status as ProjectStatus) || 'TODO',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive ?? true,
      },
      include: {
        client: true,
        timesheets: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // Get project by ID
  static async getProjectById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        timesheets: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });
  }

  // Get all projects
  static async getProjects(clientId?: string) {
    const where: any = {};

    if (clientId) {
      where.clientId = clientId;
    }

    return prisma.project.findMany({
      where,
      include: {
        client: true,
        _count: {
          select: {
            timesheets: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Update project
  static async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Validate client if provided
    if (data.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
      });

      if (!client) {
        throw new Error('Client not found');
      }
    }

    // Create update data object with only defined fields
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
      },
    });
  }

  // Delete project
  static async deleteProject(id: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        timesheets: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Check if project has timesheets
    if (project.timesheets.length > 0) {
      throw new Error('Cannot delete project with existing timesheets');
    }

    await prisma.project.delete({
      where: { id },
    });
  }

  // Get project statistics
  static async getProjectStats(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        timesheets: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const totalHours = project.timesheets.reduce((sum, timesheet) => sum + Number(timesheet.hoursWorked), 0);
    const uniqueUsers = [...new Set(project.timesheets.map(t => t.userId))];

    const hoursByUser = project.timesheets.reduce((acc, timesheet) => {
      const userName = `${timesheet.user.firstName} ${timesheet.user.lastName}`;
      acc[userName] = (acc[userName] || 0) + Number(timesheet.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const hoursByType = project.timesheets.reduce((acc, timesheet) => {
      acc[timesheet.type] = (acc[timesheet.type] || 0) + Number(timesheet.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    return {
      project,
      totalHours,
      totalEntries: project.timesheets.length,
      uniqueUsers: uniqueUsers.length,
      hoursByUser,
      hoursByType,
    };
  }
}
