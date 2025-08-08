import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

export interface SystemSettings {
  branding: {
    softwareName: string;
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;
    secondaryColor: string;
    buttonColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
    fontFamily: string;
    fontSize: string;
  };
  footer: {
    enabled: boolean;
    text: string;
    links: Array<{ label: string; url: string }>;
  };
  notifications: {
    emailNotifications: boolean;
    timesheetReminders: boolean;
    weeklyReports: boolean;
    dailyDigest: boolean;
    projectUpdates: boolean;
    clientNotifications: boolean;
    reminderTime: string;
    reminderDays: string[];
    emailTemplate: string;
    pushNotifications: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    currency: string;
    numberFormat: string;
    compactMode: boolean;
    showAnimations: boolean;
    sidebarCollapsed: boolean;
  };
  security: {
    sessionTimeout: number;
    requirePasswordChange: boolean;
    twoFactorAuth: boolean;
    passwordMinLength: number;
    passwordComplexity: string;
    loginAttempts: number;
    lockoutDuration: number;
    ipWhitelist: string[];
    auditLogging: boolean;
    dataEncryption: boolean;
  };
  system: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionPeriod: number;
    maintenanceMode: boolean;
    debugMode: boolean;
    logLevel: string;
    maxFileSize: number;
    allowedFileTypes: string[];
    dataRetention: number;
    performanceMode: boolean;
  };
}

export const getSettings = async (): Promise<SystemSettings> => {
  try {
    const settings = await prisma.systemSettings.findFirst();
    
    if (!settings) {
      // Return default settings if none exist
      return getDefaultSettings();
    }

    return {
      branding: {
        softwareName: settings.softwareName || 'Timesheet Management System',
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || '',
        primaryColor: settings.primaryColor || '#3B82F6',
        secondaryColor: settings.secondaryColor || '#10B981',
        buttonColor: settings.buttonColor || '#3B82F6',
        accentColor: settings.accentColor || '#F59E0B',
        backgroundColor: settings.backgroundColor || '#FFFFFF',
        textColor: settings.textColor || '#1F2937',
        borderRadius: settings.borderRadius || '0.375rem',
        fontFamily: settings.fontFamily || 'Inter',
        fontSize: settings.fontSize || '16px',
      },
      footer: {
        enabled: settings.footerEnabled ?? true,
        text: settings.footerText || '© 2024 Timesheet Management System. All rights reserved.',
        links: settings.footerLinks ? JSON.parse(settings.footerLinks) : [
          { label: 'Privacy Policy', url: '/privacy' },
          { label: 'Terms of Service', url: '/terms' },
        ],
      },
      notifications: {
        emailNotifications: settings.emailNotifications ?? true,
        timesheetReminders: settings.timesheetReminders ?? true,
        weeklyReports: settings.weeklyReports ?? false,
        dailyDigest: settings.dailyDigest ?? false,
        projectUpdates: settings.projectUpdates ?? true,
        clientNotifications: settings.clientNotifications ?? true,
        reminderTime: settings.reminderTime || '09:00',
        reminderDays: settings.reminderDays ? JSON.parse(settings.reminderDays) : ['monday', 'friday'],
        emailTemplate: settings.emailTemplate || '',
        pushNotifications: settings.pushNotifications ?? false,
      },
      display: {
        theme: (settings.theme as 'light' | 'dark' | 'auto') || 'light',
        language: settings.language || 'en',
        timezone: settings.timezone || 'UTC',
        dateFormat: settings.dateFormat || 'MM/DD/YYYY',
        timeFormat: settings.timeFormat || '12',
        currency: settings.currency || 'USD',
        numberFormat: settings.numberFormat || 'en-US',
        compactMode: settings.compactMode ?? false,
        showAnimations: settings.showAnimations ?? true,
        sidebarCollapsed: settings.sidebarCollapsed ?? false,
      },
      security: {
        sessionTimeout: settings.sessionTimeout || 3600,
        requirePasswordChange: settings.requirePasswordChange ?? false,
        twoFactorAuth: settings.twoFactorAuth ?? false,
        passwordMinLength: settings.passwordMinLength || 8,
        passwordComplexity: settings.passwordComplexity || 'medium',
        loginAttempts: settings.loginAttempts || 5,
        lockoutDuration: settings.lockoutDuration || 900,
        ipWhitelist: settings.ipWhitelist ? JSON.parse(settings.ipWhitelist) : [],
        auditLogging: settings.auditLogging ?? true,
        dataEncryption: settings.dataEncryption ?? true,
      },
      system: {
        autoBackup: settings.autoBackup ?? true,
        backupFrequency: settings.backupFrequency || 'daily',
        retentionPeriod: settings.retentionPeriod || 30,
        maintenanceMode: settings.maintenanceMode ?? false,
        debugMode: settings.debugMode ?? false,
        logLevel: settings.logLevel || 'info',
        maxFileSize: settings.maxFileSize || 5242880, // 5MB
        allowedFileTypes: settings.allowedFileTypes ? JSON.parse(settings.allowedFileTypes) : ['jpg', 'jpeg', 'png', 'gif', 'ico'],
        dataRetention: settings.dataRetention || 365,
        performanceMode: settings.performanceMode ?? false,
      },
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return getDefaultSettings();
  }
};

export const updateSettings = async (section: keyof SystemSettings, updates: any): Promise<SystemSettings> => {
  try {
    const existingSettings = await prisma.systemSettings.findFirst();
    
    if (!existingSettings) {
      // Create new settings record
      const newSettings = await prisma.systemSettings.create({
        data: {
          softwareName: updates.softwareName || 'Timesheet Management System',
          logoUrl: updates.logoUrl || '',
          faviconUrl: updates.faviconUrl || '',
          primaryColor: updates.primaryColor || '#3B82F6',
          secondaryColor: updates.secondaryColor || '#10B981',
          buttonColor: updates.buttonColor || '#3B82F6',
          accentColor: updates.accentColor || '#F59E0B',
          backgroundColor: updates.backgroundColor || '#FFFFFF',
          textColor: updates.textColor || '#1F2937',
          borderRadius: updates.borderRadius || '0.375rem',
          fontFamily: updates.fontFamily || 'Inter',
          fontSize: updates.fontSize || '16px',
          footerEnabled: updates.enabled ?? true,
          footerText: updates.text || '© 2024 Timesheet Management System. All rights reserved.',
          footerLinks: JSON.stringify(updates.links || [
            { label: 'Privacy Policy', url: '/privacy' },
            { label: 'Terms of Service', url: '/terms' },
          ]),
          emailNotifications: updates.emailNotifications ?? true,
          timesheetReminders: updates.timesheetReminders ?? true,
          weeklyReports: updates.weeklyReports ?? false,
          dailyDigest: updates.dailyDigest ?? false,
          projectUpdates: updates.projectUpdates ?? true,
          clientNotifications: updates.clientNotifications ?? true,
          reminderTime: updates.reminderTime || '09:00',
          reminderDays: JSON.stringify(updates.reminderDays || ['monday', 'friday']),
          emailTemplate: updates.emailTemplate || '',
          pushNotifications: updates.pushNotifications ?? false,
          sessionTimeout: updates.sessionTimeout || 3600,
          requirePasswordChange: updates.requirePasswordChange ?? false,
          twoFactorAuth: updates.twoFactorAuth ?? false,
          passwordMinLength: updates.passwordMinLength || 8,
          passwordComplexity: updates.passwordComplexity || 'medium',
          loginAttempts: updates.loginAttempts || 5,
          lockoutDuration: updates.lockoutDuration || 900,
          ipWhitelist: JSON.stringify(updates.ipWhitelist || []),
          auditLogging: updates.auditLogging ?? true,
          dataEncryption: updates.dataEncryption ?? true,
          autoBackup: updates.autoBackup ?? true,
          backupFrequency: updates.backupFrequency || 'daily',
          retentionPeriod: updates.retentionPeriod || 30,
          maintenanceMode: updates.maintenanceMode ?? false,
          debugMode: updates.debugMode ?? false,
          logLevel: updates.logLevel || 'info',
          maxFileSize: updates.maxFileSize || 5242880,
          allowedFileTypes: JSON.stringify(updates.allowedFileTypes || ['jpg', 'jpeg', 'png', 'gif', 'ico']),
          dataRetention: updates.dataRetention || 365,
          performanceMode: updates.performanceMode ?? false,
        },
      });
      
      return await getSettings();
    }

    // Update existing settings
    const updateData: any = {};
    
    if (section === 'branding') {
      Object.keys(updates).forEach(key => {
        updateData[key] = updates[key];
      });
    } else if (section === 'footer') {
      updateData.footerEnabled = updates.enabled;
      updateData.footerText = updates.text;
      updateData.footerLinks = JSON.stringify(updates.links);
    } else if (section === 'notifications') {
      updateData.emailNotifications = updates.emailNotifications;
      updateData.timesheetReminders = updates.timesheetReminders;
      updateData.weeklyReports = updates.weeklyReports;
      updateData.dailyDigest = updates.dailyDigest;
      updateData.projectUpdates = updates.projectUpdates;
      updateData.clientNotifications = updates.clientNotifications;
      updateData.reminderTime = updates.reminderTime;
      updateData.reminderDays = JSON.stringify(updates.reminderDays);
      updateData.emailTemplate = updates.emailTemplate;
      updateData.pushNotifications = updates.pushNotifications;
    } else if (section === 'display') {
      updateData.theme = updates.theme;
      updateData.language = updates.language;
      updateData.timezone = updates.timezone;
      updateData.dateFormat = updates.dateFormat;
      updateData.timeFormat = updates.timeFormat;
      updateData.currency = updates.currency;
      updateData.numberFormat = updates.numberFormat;
      updateData.compactMode = updates.compactMode;
      updateData.showAnimations = updates.showAnimations;
      updateData.sidebarCollapsed = updates.sidebarCollapsed;
    } else if (section === 'security') {
      updateData.sessionTimeout = updates.sessionTimeout;
      updateData.requirePasswordChange = updates.requirePasswordChange;
      updateData.twoFactorAuth = updates.twoFactorAuth;
      updateData.passwordMinLength = updates.passwordMinLength;
      updateData.passwordComplexity = updates.passwordComplexity;
      updateData.loginAttempts = updates.loginAttempts;
      updateData.lockoutDuration = updates.lockoutDuration;
      updateData.ipWhitelist = JSON.stringify(updates.ipWhitelist);
      updateData.auditLogging = updates.auditLogging;
      updateData.dataEncryption = updates.dataEncryption;
    } else if (section === 'system') {
      updateData.autoBackup = updates.autoBackup;
      updateData.backupFrequency = updates.backupFrequency;
      updateData.retentionPeriod = updates.retentionPeriod;
      updateData.maintenanceMode = updates.maintenanceMode;
      updateData.debugMode = updates.debugMode;
      updateData.logLevel = updates.logLevel;
      updateData.maxFileSize = updates.maxFileSize;
      updateData.allowedFileTypes = JSON.stringify(updates.allowedFileTypes);
      updateData.dataRetention = updates.dataRetention;
      updateData.performanceMode = updates.performanceMode;
    }

    await prisma.systemSettings.update({
      where: { id: existingSettings.id },
      data: updateData,
    });

    return await getSettings();
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to update settings');
  }
};

export const uploadFile = async (file: Express.Multer.File, type: 'logo' | 'favicon'): Promise<string> => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(__dirname, '../../uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (type === 'favicon') {
      allowedTypes.push('image/x-icon', 'image/vnd.microsoft.icon');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    const filename = `${type}_${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    await writeFile(filepath, file.buffer);

    // Return the full URL path
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/${filename}`;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

const getDefaultSettings = (): SystemSettings => {
  return {
    branding: {
      softwareName: 'Timesheet Management System',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      buttonColor: '#3B82F6',
      accentColor: '#F59E0B',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      borderRadius: '0.375rem',
      fontFamily: 'Inter',
      fontSize: '16px',
    },
    footer: {
      enabled: true,
      text: '© 2024 Timesheet Management System. All rights reserved.',
      links: [
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Terms of Service', url: '/terms' },
      ],
    },
    notifications: {
      emailNotifications: true,
      timesheetReminders: true,
      weeklyReports: false,
      dailyDigest: false,
      projectUpdates: true,
      clientNotifications: true,
      reminderTime: '09:00',
      reminderDays: ['monday', 'friday'],
      emailTemplate: '',
      pushNotifications: false,
    },
    display: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12',
      currency: 'USD',
      numberFormat: 'en-US',
      compactMode: false,
      showAnimations: true,
      sidebarCollapsed: false,
    },
    security: {
      sessionTimeout: 3600,
      requirePasswordChange: false,
      twoFactorAuth: false,
      passwordMinLength: 8,
      passwordComplexity: 'medium',
      loginAttempts: 5,
      lockoutDuration: 900,
      ipWhitelist: [],
      auditLogging: true,
      dataEncryption: true,
    },
    system: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriod: 30,
      maintenanceMode: false,
      debugMode: false,
      logLevel: 'info',
      maxFileSize: 5242880,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'ico'],
      dataRetention: 365,
      performanceMode: false,
    },
  };
};
