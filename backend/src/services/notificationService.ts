import { PrismaClient, Notification, NotificationType, NotificationStatus } from '@prisma/client';
import { z } from 'zod';
import { EmailConfigService } from './emailConfigService';

const prisma = new PrismaClient();

// Validation schemas
export const NotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.nativeEnum(NotificationType),
  data: z.record(z.any()).optional(),
});

export const NotificationUpdateSchema = z.object({
  status: z.nativeEnum(NotificationStatus).optional(),
  readAt: z.date().optional(),
  sentAt: z.date().optional(),
});

export type NotificationInput = z.infer<typeof NotificationSchema>;
export type NotificationUpdateInput = z.infer<typeof NotificationUpdateSchema>;

export class NotificationService {
  // Create a new notification
  static async createNotification(userId: string, data: NotificationInput): Promise<Notification> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          ...data,
        },
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  // Get user notifications
  static async getUserNotifications(userId: string, page = 1, limit = 20): Promise<{
    notifications: Notification[];
    total: number;
    totalPages: number;
    page: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({
          where: { userId },
        }),
      ]);

      return {
        notifications,
        total,
        totalPages: Math.ceil(total / limit),
        page,
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  // Get unread notifications count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          status: { not: NotificationStatus.READ },
        },
      });
      return count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw new Error('Failed to fetch unread count');
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId, // Ensure user owns the notification
        },
        data: {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      });
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          status: { not: NotificationStatus.READ },
        },
        data: {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.delete({
        where: {
          id: notificationId,
          userId, // Ensure user owns the notification
        },
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  // Send email notification
  static async sendEmailNotification(userId: string, title: string, message: string, data?: any): Promise<Notification> {
    try {
      // Create notification record
      const notification = await this.createNotification(userId, {
        title,
        message,
        type: NotificationType.EMAIL,
        data,
      });

      // Get user email and preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          email: true, 
          firstName: true, 
          lastName: true,
          preferences: {
            select: {
              emailNotifications: true
            }
          }
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has email notifications enabled
      if (!user.preferences?.emailNotifications) {
        console.log(`Email notifications disabled for user ${userId}`);
        return notification;
      }

      // Send email using EmailConfigService
      try {
        const success = await EmailConfigService.sendNotification(
          user.email,
          title,
          message,
          'default',
          data
        );
        
        // Update notification status
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: success ? NotificationStatus.SENT : NotificationStatus.FAILED,
            sentAt: success ? new Date() : undefined,
          },
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        
        // Update notification status to failed
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.FAILED,
          },
        });
      }

      return notification;
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw new Error('Failed to send email notification');
    }
  }

  // Send push notification (placeholder)
  static async sendPushNotification(userId: string, title: string, message: string, data?: any): Promise<Notification> {
    try {
      const notification = await this.createNotification(userId, {
        title,
        message,
        type: NotificationType.PUSH,
        data,
      });

      // TODO: Implement push notification service (Firebase, OneSignal, etc.)
      console.log('Push notification would be sent:', { userId, title, message, data });

      // Update notification status
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });

      return notification;
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw new Error('Failed to send push notification');
    }
  }

  // Send timesheet reminder
  static async sendTimesheetReminder(userId: string): Promise<Notification> {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          email: true, 
          firstName: true, 
          lastName: true,
          preferences: {
            select: {
              timesheetReminders: true,
              emailNotifications: true
            }
          }
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has timesheet reminders enabled
      if (!user.preferences?.timesheetReminders || !user.preferences?.emailNotifications) {
        console.log(`Timesheet reminders disabled for user ${userId}`);
        return this.createNotification(userId, {
          title: 'Timesheet Reminder',
          message: 'Don\'t forget to log your hours for today!',
          type: NotificationType.IN_APP,
          data: {
            type: 'timesheet_reminder',
            date: new Date().toISOString(),
          },
        });
      }

      const title = 'Timesheet Reminder';
      const message = 'Don\'t forget to log your hours for today!';
      
      return this.sendEmailNotification(userId, title, message, {
        type: 'timesheet_reminder',
        date: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending timesheet reminder:', error);
      throw new Error('Failed to send timesheet reminder');
    }
  }

  // Send weekly report
  static async sendWeeklyReport(userId: string, reportData: any): Promise<Notification> {
    const title = 'Weekly Timesheet Report';
    const message = 'Your weekly timesheet summary is ready.';
    
    return this.sendEmailNotification(userId, title, message, {
      type: 'weekly_report',
      reportData,
      date: new Date().toISOString(),
    });
  }

  // Send project update notification
  static async sendProjectUpdate(userId: string, projectName: string, updateMessage: string): Promise<Notification> {
    const title = `Project Update: ${projectName}`;
    const message = updateMessage;
    
    return this.sendEmailNotification(userId, title, message, {
      type: 'project_update',
      projectName,
      date: new Date().toISOString(),
    });
  }



  // Clean up old notifications
  static async cleanupOldNotifications(daysOld = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          status: {
            in: [NotificationStatus.READ, NotificationStatus.SENT],
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw new Error('Failed to cleanup old notifications');
    }
  }
}
