import { PrismaClient } from '@prisma/client';
import { EmailService, EmailConfig } from './emailService';

const prisma = new PrismaClient();

export interface EmailSettings {
  enabled: boolean;
  provider: 'smtp' | 'gmail' | 'sendgrid' | 'mailgun';
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  maxRetries: number;
  retryDelay: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  variables: string[];
  isDefault: boolean;
}

export class EmailConfigService {
  private static settings: EmailSettings | null = null;

  // Initialize email configuration
  static async initialize(): Promise<void> {
    try {
      const settings = await this.loadSettings();
      
      if (settings.enabled) {
        const emailConfig: EmailConfig = {
          host: settings.host,
          port: settings.port,
          secure: settings.secure,
          auth: {
            user: settings.username,
            pass: settings.password,
          },
          from: settings.fromEmail,
          fromName: settings.fromName,
        };

        await EmailService.initialize(emailConfig);
        this.settings = settings;
        console.log('✅ Email configuration initialized successfully');
      } else {
        console.log('ℹ️ Email notifications are disabled');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email configuration:', error);
    }
  }

  // Load email settings
  static async loadSettings(): Promise<EmailSettings> {
    return {
      enabled: process.env.EMAIL_ENABLED === 'true',
      provider: (process.env.EMAIL_PROVIDER as any) || 'smtp',
      host: process.env.EMAIL_HOST || 'localhost',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      username: process.env.EMAIL_USERNAME || '',
      password: process.env.EMAIL_PASSWORD || '',
      fromEmail: process.env.EMAIL_FROM || 'noreply@timesheet.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Timesheet System',
      replyTo: process.env.EMAIL_REPLY_TO,
      maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '5000'),
    };
  }

  // Send notification email
  static async sendNotification(
    to: string,
    subject: string,
    message: string,
    template: string = 'default',
    variables: Record<string, any> = {}
  ): Promise<boolean> {
    if (!this.settings?.enabled) {
      console.log('Email notifications are disabled');
      return false;
    }

    try {
      await EmailService.sendEmail({
        to,
        subject,
        template,
        variables: {
          ...variables,
          message,
          subject,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }
  }

  // Send timesheet reminder
  static async sendTimesheetReminder(
    userEmail: string,
    userName: string,
    date: string,
    hoursToLog: string = '8'
  ): Promise<boolean> {
    const variables = {
      userName,
      date,
      currentDate: new Date().toLocaleDateString(),
      hoursToLog,
      timesheetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/timesheets`,
      companyName: this.settings?.fromName || 'Timesheet Management System',
    };

    return this.sendNotification(
      userEmail,
      `Timesheet Reminder - ${date}`,
      `Hello ${userName}, this is a friendly reminder to log your hours for ${date}.`,
      'timesheet_reminder',
      variables
    );
  }

  // Send welcome email
  static async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    role: string
  ): Promise<boolean> {
    const variables = {
      userName,
      subject: 'Welcome to Timesheet Management System',
      message: `Welcome ${userName}! Your account has been created successfully with the role of ${role}.`,
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
      actionText: 'Login to Your Account',
      companyName: this.settings?.fromName || 'Timesheet Management System',
    };

    return this.sendNotification(
      userEmail,
      'Welcome to Timesheet Management System',
      `Welcome ${userName}! Your account has been created successfully.`,
      'detailed',
      variables
    );
  }

  // Test email configuration
  static async testConfiguration(testEmail: string): Promise<boolean> {
    if (!this.settings?.enabled) {
      return false;
    }

    try {
      const variables = {
        userName: 'Test User',
        subject: 'Email Configuration Test',
        message: 'This is a test email to verify your email configuration is working correctly.',
        companyName: this.settings.fromName,
      };

      await EmailService.sendEmail({
        to: testEmail,
        subject: 'Email Configuration Test',
        template: 'default',
        variables,
      });

      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }

  // Get email status
  static getStatus(): { enabled: boolean; configured: boolean; connected: boolean } {
    const emailStatus = EmailService.getStatus();
    return {
      enabled: this.settings?.enabled || false,
      configured: emailStatus.configured,
      connected: emailStatus.connected,
    };
  }
}