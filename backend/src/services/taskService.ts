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
  assignedTo?: string[];
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
  assignedTo?: string[];
}

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string[];
}

export class TaskService {
  static async getTasks(filters: TaskFilters = {}): Promise<any[]> {
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

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          include: {
            client: true,
          },
        },
        timesheets: true,
        assignments: true,
        _count: {
          select: { comments: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tasks.map(({ assignments, _count, ...task }) => ({
      ...task,
      assignedTo: assignments.map(a => a.userId),
      commentCount: _count.comments
    }));
  }

  static async getTaskById(id: string): Promise<any | null> {
    const task = await prisma.task.findUnique({
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
        assignments: true,
        _count: {
          select: { comments: true }
        }
      },
    });

    if (!task) return null;

    const { assignments, _count, ...rest } = task;
    return {
      ...rest,
      assignedTo: assignments.map(a => a.userId),
      commentCount: _count.comments
    };
  }

  static async createTask(data: CreateTaskData): Promise<any> {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const { assignedTo, ...taskData } = data;

    const task = await prisma.task.create({
      data: {
        ...taskData,
        status: taskData.status || 'TODO',
        priority: taskData.priority || 'MEDIUM',
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        assignments: true,
        _count: {
          select: { comments: true }
        }
      },
    });

    if (assignedTo && assignedTo.length > 0) {
      await prisma.taskAssignment.createMany({
        data: assignedTo.map(userId => ({
          taskId: task.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    // Refresh the task to include new assignments
    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        assignments: true,
        _count: {
          select: { comments: true }
        }
      },
    });

    if (!updatedTask) throw new Error('Failed to fetch updated task');

    const { assignments, _count, ...rest } = updatedTask;
    return {
      ...rest,
      assignedTo: assignments.map(a => a.userId),
      commentCount: _count.comments
    };
  }

  static async updateTask(id: string, data: UpdateTaskData): Promise<any> {
    // Verify task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    const { assignedTo, ...updateData } = data;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          include: {
            client: true,
          },
        },
        assignments: true,
        _count: {
          select: { comments: true }
        }
      },
    });

    if (assignedTo !== undefined) {
      // Delete existing assignments
      await prisma.taskAssignment.deleteMany({
        where: { taskId: id },
      });

      // Create new assignments if provided
      if (assignedTo.length > 0) {
        await prisma.taskAssignment.createMany({
          data: assignedTo.map(userId => ({
            taskId: id,
            userId,
          })),
          skipDuplicates: true,
        });
      }
    }

    const { assignments, _count, ...rest } = task;
    return {
      ...rest,
      assignedTo: assignments.map(a => a.userId),
      commentCount: _count.comments
    };
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

  static async getTasksByProject(projectId: string): Promise<any[]> {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        timesheets: true,
        assignments: true,
        _count: {
          select: { comments: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tasks.map(({ assignments, _count, ...task }) => ({
      ...task,
      assignedTo: assignments.map(a => a.userId),
      commentCount: _count.comments
    }));
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
