import { PrismaClient, TaskComment } from '@prisma/client';
import { UserMentionService } from './userMentionService';

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
  // Get all comments for a task
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
        mentions: {
          include: {
            mentionedUser: {
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
      orderBy: { createdAt: 'asc' },
    });
  }

  // Get a single comment by ID
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
        mentions: {
          include: {
            mentionedUser: {
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

  static async createComment(data: CreateCommentData): Promise<TaskComment> {
    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
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

    // Create the comment
    const comment = await prisma.taskComment.create({
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

    // Parse and store user mentions
    try {
      const mentions = await UserMentionService.parseMentions(data.content);
      if (mentions.length > 0) {
        await UserMentionService.storeMentions(comment.id, mentions);
        
        // Send notifications to mentioned users
        const commentAuthor = `${user.firstName} ${user.lastName}`;
        await UserMentionService.sendMentionNotifications(
          comment.id,
          mentions,
          commentAuthor,
          task.name,
          task.id
        );
      }
    } catch (error) {
      console.error('Error processing user mentions:', error);
      // Don't fail the comment creation if mention processing fails
    }

    // Return comment with mentions
    return await this.getCommentById(comment.id) as TaskComment;
  }

  static async updateComment(id: string, data: UpdateCommentData, userId: string): Promise<TaskComment> {
    // Verify comment exists and belongs to user
    const existingComment = await prisma.taskComment.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingComment) {
      throw new Error('Comment not found');
    }

    if (existingComment.userId !== userId) {
      throw new Error('You can only edit your own comments');
    }

    // Update the comment
    const updatedComment = await prisma.taskComment.update({
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

    // Remove old mentions and process new ones
    try {
      await UserMentionService.removeCommentMentions(id);
      
      const mentions = await UserMentionService.parseMentions(data.content);
      if (mentions.length > 0) {
        await UserMentionService.storeMentions(id, mentions);
        
        // Send notifications to newly mentioned users
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true },
        });
        
        if (user) {
          const commentAuthor = `${user.firstName} ${user.lastName}`;
          await UserMentionService.sendMentionNotifications(
            id,
            mentions,
            commentAuthor,
            existingComment.task.name,
            existingComment.taskId
          );
        }
      }
    } catch (error) {
      console.error('Error processing user mentions on update:', error);
      // Don't fail the comment update if mention processing fails
    }

    // Return updated comment with mentions
    return await this.getCommentById(id) as TaskComment;
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

    // Remove mentions first
    await UserMentionService.removeCommentMentions(id);

    // Delete the comment
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
