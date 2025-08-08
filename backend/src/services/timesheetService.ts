import { PrismaClient, Timesheet, TimesheetType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTimesheetData {
  date: Date;
  hours: number;
  taskName: string;
  description?: string;
  type: TimesheetType;
  projectId: string;
  userId: string;
}

export interface UpdateTimesheetData {
  date?: Date;
  hours?: number;
  taskName?: string;
  description?: string;
  type?: TimesheetType;
  projectId?: string;
}

export interface TimesheetFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  projectId?: string;
  clientId?: string;
  type?: TimesheetType;
}

export class TimesheetService {
  // Create new timesheet entry
  static async createTimesheet(data: CreateTimesheetData): Promise<Timesheet> {
    // Validate that the project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: { client: true },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Validate that the user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate hours (must be positive and reasonable)
    if (data.hours <= 0 || data.hours > 24) {
      throw new Error('Hours must be between 0 and 24');
    }

    // Check for duplicate entry on same date for same user and project
    const existingEntry = await prisma.timesheet.findFirst({
      where: {
        date: data.date,
        userId: data.userId,
        projectId: data.projectId,
        taskName: data.taskName,
      },
    });

    if (existingEntry) {
      throw new Error('A timesheet entry already exists for this task on this date');
    }

    return prisma.timesheet.create({
      data: {
        date: data.date,
        hoursWorked: data.hours,
        taskName: data.taskName,
        description: data.description,
        type: data.type,
        projectId: data.projectId,
        userId: data.userId,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Get timesheet by ID
  static async getTimesheetById(id: string): Promise<Timesheet | null> {
    return prisma.timesheet.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Get timesheets with filters
  static async getTimesheets(filters: TimesheetFilters = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.date = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    } else if (filters.startDate) {
      where.date = {
        gte: filters.startDate,
      };
    } else if (filters.endDate) {
      where.date = {
        lte: filters.endDate,
      };
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    // If filtering by client, we need to join through projects
    if (filters.clientId) {
      where.project = {
        clientId: filters.clientId,
      };
    }

    const [timesheets, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        include: {
          project: {
            include: {
              client: true,
            },
          },
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
        skip,
        take: limit,
      }),
      prisma.timesheet.count({ where }),
    ]);

    return {
      timesheets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Update timesheet
  static async updateTimesheet(id: string, data: UpdateTimesheetData): Promise<Timesheet> {
    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
    });

    if (!timesheet) {
      throw new Error('Timesheet not found');
    }

    // Validate hours if provided
    if (data.hours !== undefined && (data.hours <= 0 || data.hours > 24)) {
      throw new Error('Hours must be between 0 and 24');
    }

    // Validate project if provided
    if (data.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }
    }

    const updateData: any = {};
    if (data.date !== undefined) updateData.date = data.date;
    if (data.hours !== undefined) updateData.hoursWorked = data.hours;
    if (data.taskName !== undefined) updateData.taskName = data.taskName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.projectId !== undefined) updateData.projectId = data.projectId;

    return prisma.timesheet.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          include: {
            client: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Delete timesheet
  static async deleteTimesheet(id: string): Promise<void> {
    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
    });

    if (!timesheet) {
      throw new Error('Timesheet not found');
    }

    await prisma.timesheet.delete({
      where: { id },
    });
  }

  // Get timesheet summary for a user
  static async getTimesheetSummary(userId: string, startDate: Date, endDate: Date) {
    const timesheets = await prisma.timesheet.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });

    const totalHours = timesheets.reduce((sum, timesheet) => sum + Number(timesheet.hoursWorked), 0);
    const projects = [...new Set(timesheets.map(t => t.projectId))];
    const clients = [...new Set(timesheets.map(t => t.project.clientId))];

    const hoursByType = timesheets.reduce((acc, timesheet) => {
      acc[timesheet.type] = (acc[timesheet.type] || 0) + Number(timesheet.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const hoursByProject = timesheets.reduce((acc, timesheet) => {
      const projectName = timesheet.project.name;
      acc[projectName] = (acc[projectName] || 0) + Number(timesheet.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalHours,
      totalEntries: timesheets.length,
      uniqueProjects: projects.length,
      uniqueClients: clients.length,
      hoursByType,
      hoursByProject,
      timesheets,
    };
  }

  // Get timesheet summary for admin (all users)
  static async getAdminTimesheetSummary(startDate: Date, endDate: Date) {
    const timesheets = await prisma.timesheet.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const totalHours = timesheets.reduce((sum, timesheet) => sum + Number(timesheet.hoursWorked), 0);
    const uniqueUsers = [...new Set(timesheets.map(t => t.userId))];
    const uniqueProjects = [...new Set(timesheets.map(t => t.projectId))];
    const uniqueClients = [...new Set(timesheets.map(t => t.project.clientId))];

    const hoursByUser = timesheets.reduce((acc, timesheet) => {
      const userName = `${timesheet.user.firstName} ${timesheet.user.lastName}`;
      acc[userName] = (acc[userName] || 0) + Number(timesheet.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const hoursByProject = timesheets.reduce((acc, timesheet) => {
      const projectName = timesheet.project.name;
      acc[projectName] = (acc[projectName] || 0) + Number(timesheet.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const hoursByClient = timesheets.reduce((acc, timesheet) => {
      const clientName = timesheet.project.client.name;
      acc[clientName] = (acc[clientName] || 0) + Number(timesheet.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalHours,
      totalEntries: timesheets.length,
      uniqueUsers: uniqueUsers.length,
      uniqueProjects: uniqueProjects.length,
      uniqueClients: uniqueClients.length,
      hoursByUser,
      hoursByProject,
      hoursByClient,
      timesheets,
    };
  }
}
