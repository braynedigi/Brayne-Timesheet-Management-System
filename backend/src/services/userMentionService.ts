import { PrismaClient, UserMention, User } from '@prisma/client';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

export interface ParsedMention {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export class UserMentionService {
  // Parse comment content for @mentions and find matching users
  static async parseMentions(content: string): Promise<ParsedMention[]> {
    const mentionRegex = /@(\w+)/g;
    const mentions: ParsedMention[] = [];
    const matches = content.match(mentionRegex);
    
    if (!matches) return mentions;

    for (const match of matches) {
      const username = match.slice(1); // Remove @ symbol
      
      // Search for users by first name, last name, or email
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: username, mode: 'insensitive' } },
            { lastName: { contains: username, mode: 'insensitive' } },
            { email: { contains: username, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        take: 5, // Limit results
      });

      // Map users to ParsedMention format
      const parsedUsers = users.map(user => ({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }));

      mentions.push(...parsedUsers);
    }

    // Remove duplicates based on userId
    const uniqueMentions = mentions.filter((mention, index, self) => 
      index === self.findIndex(m => m.userId === mention.userId)
    );

    return uniqueMentions;
  }

  // Store user mentions for a comment
  static async storeMentions(commentId: string, mentions: ParsedMention[]): Promise<UserMention[]> {
    if (mentions.length === 0) return [];

    const mentionData = mentions.map(mention => ({
      commentId,
      mentionedUserId: mention.userId,
    }));

    const createdMentions = await prisma.userMention.createMany({
      data: mentionData,
      skipDuplicates: true,
    });

    return await prisma.userMention.findMany({
      where: { commentId },
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
    });
  }

  // Send notifications to mentioned users
  static async sendMentionNotifications(
    commentId: string, 
    mentions: ParsedMention[], 
    commentAuthor: string,
    taskName: string,
    taskId: string
  ): Promise<void> {
    for (const mention of mentions) {
      try {
        const title = `You were mentioned in a comment`;
        const message = `${commentAuthor} mentioned you in a comment on task: ${taskName}`;
        
        // Send in-app notification
        await NotificationService.sendInAppNotification(mention.userId, title, message, {
          type: 'mention',
          commentId,
          taskId,
          taskName,
          commentAuthor,
        });

        // Send email notification
        await NotificationService.sendEmailNotification(mention.userId, title, message, {
          type: 'mention',
          commentId,
          taskId,
          taskName,
          commentAuthor,
        });
      } catch (error) {
        console.error(`Failed to send mention notification to user ${mention.userId}:`, error);
      }
    }
  }

  // Get all mentions for a specific comment
  static async getCommentMentions(commentId: string): Promise<UserMention[]> {
    return await prisma.userMention.findMany({
      where: { commentId },
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
    });
  }

  // Get all mentions for a user
  static async getUserMentions(userId: string): Promise<UserMention[]> {
    return await prisma.userMention.findMany({
      where: { mentionedUserId: userId },
      include: {
        comment: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            task: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Remove mentions when a comment is deleted
  static async removeCommentMentions(commentId: string): Promise<void> {
    await prisma.userMention.deleteMany({
      where: { commentId },
    });
  }
}
