import express from 'express';
import { EmailService, EmailConfig } from '../services/emailService';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

// Email configuration schema
const EmailConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().min(1).max(65535),
  secure: z.boolean(),
  auth: z.object({
    user: z.string().email(),
    pass: z.string().min(1),
  }),
  from: z.string().email(),
  fromName: z.string().min(1),
});

// Get email configuration status
router.get('/status', authenticateToken, requireAdmin, async (req, res): Promise<void> => {
  try {
    const status = EmailService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting email status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get email status',
    });
  }
});

// Get email templates
router.get('/templates', authenticateToken, requireAdmin, async (req, res): Promise<void> => {
  try {
    const templates = EmailService.getDefaultTemplates();
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error getting email templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get email templates',
    });
  }
});

// Configure email settings
router.post('/configure', authenticateToken, requireAdmin, async (req, res): Promise<void> => {
  try {
    const validationResult = EmailConfigSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid email configuration',
        details: validationResult.error.errors,
      });
      return;
    }

    const config: EmailConfig = validationResult.data;
    
    // Initialize email service
    await EmailService.initialize(config);
    
    res.json({
      success: true,
      message: 'Email configuration updated successfully',
    });
  } catch (error) {
    console.error('Error configuring email:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to configure email',
    });
  }
});

// Test email connection
router.post('/test', authenticateToken, requireAdmin, async (req, res): Promise<void> => {
  try {
    const isConnected = await EmailService.testConnection();
    
    if (isConnected) {
      res.json({
        success: true,
        message: 'Email connection test successful',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Email connection test failed',
      });
    }
  } catch (error) {
    console.error('Error testing email connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test email connection',
    });
  }
});

// Send test email
router.post('/send-test', authenticateToken, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { to, template = 'default', subject, message } = req.body;
    
    if (!to || !subject || !message) {
      res.status(400).json({
        success: false,
        error: 'To, subject, and message are required',
      });
      return;
    }

    await EmailService.sendEmail({
      to,
      subject,
      template,
      variables: {
        subject,
        message,
        companyName: 'Timesheet Management System',
      },
    });
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send test email',
    });
  }
});

// Send timesheet reminder
router.post('/send-reminder', authenticateToken, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { userEmail, userName, date } = req.body;
    
    if (!userEmail || !userName || !date) {
      res.status(400).json({
        success: false,
        error: 'User email, name, and date are required',
      });
      return;
    }

    await EmailService.sendTimesheetReminder(userEmail, userName, date);
    
    res.json({
      success: true,
      message: 'Timesheet reminder sent successfully',
    });
  } catch (error) {
    console.error('Error sending timesheet reminder:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send timesheet reminder',
    });
  }
});

// Send weekly report
router.post('/send-weekly-report', authenticateToken, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { userEmail, userName, reportData } = req.body;
    
    if (!userEmail || !userName || !reportData) {
      res.status(400).json({
        success: false,
        error: 'User email, name, and report data are required',
      });
      return;
    }

    await EmailService.sendWeeklyReport(userEmail, userName, reportData);
    
    res.json({
      success: true,
      message: 'Weekly report sent successfully',
    });
  } catch (error) {
    console.error('Error sending weekly report:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send weekly report',
    });
  }
});

export default router;
