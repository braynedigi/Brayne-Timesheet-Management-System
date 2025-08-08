import { PrismaClient, User, NotificationType } from '@prisma/client';
import { NotificationService } from './notificationService';
import { EmailConfigService } from './emailConfigService';

const prisma = new PrismaClient();

export class ScheduledNotificationService {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;

  // Start the scheduled notification service
  static start(): void {
    if (this.isRunning) {
      console.log('Scheduled notification service is already running');
      return;
    }

    this.isRunning = true;
    
    // Check every hour for notifications to send
    this.intervalId = setInterval(async () => {
      await this.processScheduledNotifications();
    }, 60 * 60 * 1000); // 1 hour

    // Also run immediately on startup
    this.processScheduledNotifications();

    console.log('✅ Scheduled notification service started');
  }

  // Stop the scheduled notification service
  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Scheduled notification service stopped');
  }

  // Process scheduled notifications
  private static async processScheduledNotifications(): Promise<void> {
    try {
      console.log('🕐 Processing scheduled notifications...');
      
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

      // Get all active users with timesheet reminders enabled
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          preferences: {
            timesheetReminders: true,
            emailNotifications: true,
          },
        },
        include: {
          preferences: true,
        },
      });

      for (const user of users) {
        await this.processUserNotifications(user, currentDay, currentTime);
      }

      console.log(`✅ Processed notifications for ${users.length} users`);
    } catch (error) {
      console.error('❌ Error processing scheduled notifications:', error);
    }
  }

  // Process notifications for a specific user
  private static async processUserNotifications(
    user: User & { preferences: any },
    currentDay: string,
    currentTime: string
  ): Promise<void> {
    try {
      const preferences = user.preferences;
      
      // Check if today is a reminder day
      if (!preferences.reminderDays.includes(currentDay)) {
        return;
      }

      // Check if it's time to send reminder
      if (preferences.reminderTime !== currentTime) {
        return;
      }

      // Check if user has already logged hours for today
      const today = new Date().toISOString().split('T')[0];
      const existingTimesheet = await prisma.timesheet.findFirst({
        where: {
          userId: user.id,
          date: today,
        },
      });

      if (existingTimesheet) {
        console.log(`User ${user.email} already has timesheet for today`);
        return;
      }

      // Send timesheet reminder
      await NotificationService.sendTimesheetReminder(user.id);
      console.log(`📧 Sent timesheet reminder to ${user.email}`);

    } catch (error) {
      console.error(`Error processing notifications for user ${user.email}:`, error);
    }
  }

  // Get service status
  static getStatus(): { running: boolean; lastRun?: Date } {
    return {
      running: this.isRunning,
    };
  }
}