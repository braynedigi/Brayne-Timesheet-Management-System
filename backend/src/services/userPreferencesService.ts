import { PrismaClient, UserPreferences } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional(),
  currency: z.string().optional(),
  customCurrencyId: z.string().optional(),
  numberFormat: z.string().optional(),
  compactMode: z.boolean().optional(),
  showAnimations: z.boolean().optional(),
  sidebarCollapsed: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  timesheetReminders: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
  dailyDigest: z.boolean().optional(),
  projectUpdates: z.boolean().optional(),
  clientNotifications: z.boolean().optional(),
  reminderTime: z.string().optional(),
  reminderDays: z.array(z.string()).optional(),
  sessionTimeout: z.number().optional(),
  requirePasswordChange: z.boolean().optional(),
  twoFactorAuth: z.boolean().optional(),
  customSettings: z.record(z.any()).optional(),
});

export type UserPreferencesInput = z.infer<typeof UserPreferencesSchema>;

export class UserPreferencesService {
  // Get user preferences
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const preferences = await prisma.userPreferences.findUnique({
        where: { userId },
      });
      return preferences;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw new Error('Failed to fetch user preferences');
    }
  }

  // Create or update user preferences
  static async upsertUserPreferences(userId: string, data: UserPreferencesInput): Promise<UserPreferences> {
    try {
      const preferences = await prisma.userPreferences.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          ...data,
        },
      });
      return preferences;
    } catch (error) {
      console.error('Error upserting user preferences:', error);
      throw new Error('Failed to save user preferences');
    }
  }

  // Update specific preference fields
  static async updateUserPreferences(userId: string, updates: Partial<UserPreferencesInput>): Promise<UserPreferences> {
    try {
      const preferences = await prisma.userPreferences.update({
        where: { userId },
        data: updates,
      });
      return preferences;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  // Delete user preferences
  static async deleteUserPreferences(userId: string): Promise<void> {
    try {
      await prisma.userPreferences.delete({
        where: { userId },
      });
    } catch (error) {
      console.error('Error deleting user preferences:', error);
      throw new Error('Failed to delete user preferences');
    }
  }

  // Get preferences for multiple users (admin function)
  static async getMultipleUserPreferences(userIds: string[]): Promise<UserPreferences[]> {
    try {
      const preferences = await prisma.userPreferences.findMany({
        where: {
          userId: { in: userIds },
        },
      });
      return preferences;
    } catch (error) {
      console.error('Error fetching multiple user preferences:', error);
      throw new Error('Failed to fetch user preferences');
    }
  }

  // Sync preferences across devices (for future implementation)
  static async syncPreferences(userId: string, deviceId: string, preferences: UserPreferencesInput): Promise<UserPreferences> {
    try {
      // For now, just update the preferences
      // In the future, this could handle device-specific preferences
      const updatedPreferences = await this.upsertUserPreferences(userId, preferences);
      
      // Log the sync event
      console.log(`Preferences synced for user ${userId} from device ${deviceId}`);
      
      return updatedPreferences;
    } catch (error) {
      console.error('Error syncing preferences:', error);
      throw new Error('Failed to sync preferences');
    }
  }

  // Get default preferences
  static getDefaultPreferences(): UserPreferencesInput {
    return {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD',
      numberFormat: '1,234.56',
      compactMode: false,
      showAnimations: true,
      sidebarCollapsed: false,
      emailNotifications: true,
      pushNotifications: false,
      timesheetReminders: true,
      weeklyReports: false,
      dailyDigest: false,
      projectUpdates: true,
      clientNotifications: true,
      reminderTime: '09:00',
      reminderDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      sessionTimeout: 30,
      requirePasswordChange: false,
      twoFactorAuth: false,
      customSettings: {},
    };
  }
}
