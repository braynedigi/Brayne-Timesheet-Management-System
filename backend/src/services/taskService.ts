import { PrismaClient, Task, TaskStatus, TaskPriority } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTaskData {
  name: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  assignedTo?: string;
  projectId: string;
}

export interface UpdateTaskData {
  name?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  assignedTo?: string;
}

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
}

export class TaskService {
  static async getTasks(filters: TaskFilters = {}): Promise<Task[]> {
    const where: any = {};

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    return await prisma.task.findMany({
      where,
      include: {
        project: {
          include: {
            client: true,
          },
        },
        timesheets: true,
        comments: {
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
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getTaskById(id: string): Promise<Task | null> {
    return await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        timesheets: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async createTask(data: CreateTaskData): Promise<Task> {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Verify assigned user exists if provided
    if (data.assignedTo) {
      const user = await prisma.user.findUnique({
        where: { id: data.assignedTo },
      });

      if (!user) {
        throw new Error('Assigned user not found');
      }
    }

    return await prisma.task.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        estimatedHours: data.estimatedHours,
        actualHours: data.actualHours,
        dueDate: data.dueDate,
        assignedTo: data.assignedTo,
        projectId: data.projectId,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });
  }

  static async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    // Verify task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    // Verify assigned user exists if provided
    if (data.assignedTo) {
      const user = await prisma.user.findUnique({
        where: { id: data.assignedTo },
      });

      if (!user) {
        throw new Error('Assigned user not found');
      }
    }

    return await prisma.task.update({
      where: { id },
      data,
      include: {
        project: {
          include: {
            client: true,
          },
        },
      },
    });
  }

  static async deleteTask(id: string): Promise<void> {
    // Verify task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    await prisma.task.delete({
      where: { id },
    });
  }

  static async getTasksByProject(projectId: string): Promise<Task[]> {
    return await prisma.task.findMany({
      where: { projectId },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        timesheets: true,
        comments: {
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
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getTaskStatistics(projectId?: string) {
    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }

    const tasks = await prisma.task.findMany({ where });

    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'TODO').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      review: tasks.filter(t => t.status === 'REVIEW').length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      cancelled: tasks.filter(t => t.status === 'CANCELLED').length,
      overdue: tasks.filter(t => {
        if (!t.dueDate || t.status === 'COMPLETED' || t.status === 'CANCELLED') {
          return false;
        }
        return new Date(t.dueDate) < new Date();
      }).length,
    };

    return stats;
  }
}
