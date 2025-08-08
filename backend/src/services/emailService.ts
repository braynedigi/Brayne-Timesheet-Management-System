import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  fromName: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  variables: string[];
}

export interface EmailData {
  to: string;
  subject: string;
  template: string;
  variables?: Record<string, any>;
  html?: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static config: EmailConfig | null = null;

  // Initialize email configuration
  static async initialize(config: EmailConfig): Promise<void> {
    this.config = config;
    
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });

    // Verify connection
    try {
      if (this.transporter) {
        await this.transporter.verify();
        console.log('✅ Email service initialized successfully');
      }
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      throw new Error('Failed to initialize email service');
    }
  }

  // Get default email templates
  static getDefaultTemplates(): EmailTemplate[] {
    return [
      {
        id: 'default',
        name: 'Default Template',
        subject: '{{subject}}',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>{{subject}}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>{{companyName}}</h1>
              </div>
              <div class="content">
                <h2>{{subject}}</h2>
                <p>{{message}}</p>
                {{#if actionUrl}}
                <p><a href="{{actionUrl}}" style="background: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">{{actionText}}</a></p>
                {{/if}}
              </div>
              <div class="footer">
                <p>This email was sent from {{companyName}}</p>
                <p>If you have any questions, please contact support.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
{{subject}}

{{message}}

{{#if actionUrl}}
{{actionText}}: {{actionUrl}}
{{/if}}

---
{{companyName}}
        `,
        variables: ['subject', 'message', 'companyName', 'actionUrl', 'actionText']
      },
      {
        id: 'minimal',
        name: 'Minimal Template',
        subject: '{{subject}}',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>{{subject}}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 500px; margin: 0 auto; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>{{subject}}</h2>
              <p>{{message}}</p>
            </div>
          </body>
          </html>
        `,
        text: `
{{subject}}

{{message}}
        `,
        variables: ['subject', 'message']
      },
      {
        id: 'detailed',
        name: 'Detailed Template',
        subject: '{{subject}}',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>{{subject}}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 700px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { padding: 30px; background: white; border: 1px solid #e5e7eb; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
              .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
              .info-box { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 15px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>{{companyName}}</h1>
                <p>{{tagline}}</p>
              </div>
              <div class="content">
                <h2>{{subject}}</h2>
                <p>{{message}}</p>
                
                {{#if details}}
                <div class="info-box">
                  <h3>Details:</h3>
                  <p>{{details}}</p>
                </div>
                {{/if}}
                
                {{#if actionUrl}}
                <p><a href="{{actionUrl}}" class="button">{{actionText}}</a></p>
                {{/if}}
                
                {{#if additionalInfo}}
                <p><strong>Additional Information:</strong></p>
                <p>{{additionalInfo}}</p>
                {{/if}}
              </div>
              <div class="footer">
                <p><strong>{{companyName}}</strong></p>
                <p>{{companyAddress}}</p>
                <p>Email: {{companyEmail}} | Phone: {{companyPhone}}</p>
                <p><small>This email was sent to {{recipientEmail}} on {{date}}</small></p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
{{subject}}

{{message}}

{{#if details}}
Details:
{{details}}
{{/if}}

{{#if actionUrl}}
{{actionText}}: {{actionUrl}}
{{/if}}

{{#if additionalInfo}}
Additional Information:
{{additionalInfo}}
{{/if}}

---
{{companyName}}
{{companyAddress}}
Email: {{companyEmail}} | Phone: {{companyPhone}}
Sent to: {{recipientEmail}} on {{date}}
        `,
        variables: ['subject', 'message', 'companyName', 'tagline', 'details', 'actionUrl', 'actionText', 'additionalInfo', 'companyAddress', 'companyEmail', 'companyPhone', 'recipientEmail', 'date']
      },
      {
        id: 'timesheet_reminder',
        name: 'Timesheet Reminder',
        subject: 'Timesheet Reminder - {{date}}',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Timesheet Reminder</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10B981; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Timesheet Reminder</h1>
              </div>
              <div class="content">
                <h2>Hello {{userName}},</h2>
                <p>This is a friendly reminder to log your hours for <strong>{{date}}</strong>.</p>
                
                <p><strong>Today's Date:</strong> {{currentDate}}</p>
                <p><strong>Hours to log:</strong> {{hoursToLog}}</p>
                
                <p>Please take a moment to update your timesheet with today's work activities.</p>
                
                <p><a href="{{timesheetUrl}}" class="button">Log Hours Now</a></p>
                
                <p>If you have any questions, please contact your manager.</p>
              </div>
              <div class="footer">
                <p>This reminder was sent automatically by {{companyName}}</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Timesheet Reminder - {{date}}

Hello {{userName}},

This is a friendly reminder to log your hours for {{date}}.

Today's Date: {{currentDate}}
Hours to log: {{hoursToLog}}

Please take a moment to update your timesheet with today's work activities.

Log Hours Now: {{timesheetUrl}}

If you have any questions, please contact your manager.

---
{{companyName}}
        `,
        variables: ['userName', 'date', 'currentDate', 'hoursToLog', 'timesheetUrl', 'companyName']
      }
    ];
  }

  // Process template variables
  private static processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    // Replace variables in the format {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value || '');
    });
    
    return processed;
  }

  // Send email with template
  static async sendEmail(data: EmailData): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    try {
      const templates = this.getDefaultTemplates();
      const template = templates.find(t => t.id === data.template) || templates[0];
      
      // Prepare variables
      const variables = {
        ...data.variables,
        date: new Date().toLocaleDateString(),
        currentDate: new Date().toLocaleDateString(),
        companyName: this.config?.fromName || 'Timesheet Management System',
        recipientEmail: data.to,
      };

      // Process template
      const subject = this.processTemplate(template.subject, variables);
      const html = data.html || this.processTemplate(template.html, variables);
      const text = data.text || this.processTemplate(template.text, variables);

      // Send email
      await this.transporter.sendMail({
        from: `"${this.config?.fromName}" <${this.config?.from}>`,
        to: data.to,
        subject,
        text,
        html,
      });

      console.log(`✅ Email sent successfully to ${data.to}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  // Send timesheet reminder
  static async sendTimesheetReminder(userEmail: string, userName: string, date: string): Promise<void> {
    const variables = {
      userName,
      date,
      currentDate: new Date().toLocaleDateString(),
      hoursToLog: '8',
      timesheetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/timesheets`,
      companyName: this.config?.fromName || 'Timesheet Management System',
    };

    await this.sendEmail({
      to: userEmail,
      subject: `Timesheet Reminder - ${date}`,
      template: 'timesheet_reminder',
      variables,
    });
  }

  // Send weekly report
  static async sendWeeklyReport(userEmail: string, userName: string, reportData: any): Promise<void> {
    const variables = {
      userName,
      subject: 'Weekly Timesheet Report',
      message: 'Your weekly timesheet summary is ready.',
      details: `Total Hours: ${reportData.totalHours || 0}\nProjects: ${reportData.projects || 0}\nTasks: ${reportData.tasks || 0}`,
      companyName: this.config?.fromName || 'Timesheet Management System',
    };

    await this.sendEmail({
      to: userEmail,
      subject: 'Weekly Timesheet Report',
      template: 'detailed',
      variables,
    });
  }

  // Test email configuration
  static async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  // Get email configuration status
  static getStatus(): { configured: boolean; connected: boolean } {
    return {
      configured: !!this.config,
      connected: !!this.transporter,
    };
  }
}
