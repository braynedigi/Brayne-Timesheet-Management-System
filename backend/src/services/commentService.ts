import { PrismaClient, TaskComment } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCommentData {
  content: string;
  taskId: string;
  userId: string;
}

export interface UpdateCommentData {
  content: string;
}

export class CommentService {
  static async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return await prisma.taskComment.findMany({
      where: { taskId },
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
    });
  }

  static async getCommentById(id: string): Promise<TaskComment | null> {
    return await prisma.taskComment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async createComment(data: CreateCommentData): Promise<TaskComment> {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return await prisma.taskComment.create({
      data: {
        content: data.content,
        taskId: data.taskId,
        userId: data.userId,
      },
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
    });
  }

  static async updateComment(id: string, data: UpdateCommentData, userId: string): Promise<TaskComment> {
    // Verify comment exists and belongs to user
    const existingComment = await prisma.taskComment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    if (existingComment.userId !== userId) {
      throw new Error('You can only edit your own comments');
    }

    return await prisma.taskComment.update({
      where: { id },
      data: {
        content: data.content,
      },
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
    });
  }

  static async deleteComment(id: string, userId: string): Promise<void> {
    // Verify comment exists and belongs to user
    const existingComment = await prisma.taskComment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    if (existingComment.userId !== userId) {
      throw new Error('You can only delete your own comments');
    }

    await prisma.taskComment.delete({
      where: { id },
    });
  }

  static async getCommentCount(taskId: string): Promise<number> {
    return await prisma.taskComment.count({
      where: { taskId },
    });
  }
}
