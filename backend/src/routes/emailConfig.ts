import express from 'express';
import { z } from 'zod';
import { EmailConfigService } from '../services/emailConfigService';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Get email configuration status
router.get('/status', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const status = EmailConfigService.getStatus();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error fetching email status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email status',
    });
  }
});

// Test email configuration
router.post('/test', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      res.status(400).json({
        success: false,
        error: 'Test email address is required',
      });
      return;
    }

    const success = await EmailConfigService.testConfiguration(testEmail);
    
    res.json({
      success: true,
      data: { success },
      message: success ? 'Test email sent successfully' : 'Failed to send test email',
    });
  } catch (error) {
    console.error('Error testing email configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test email configuration',
    });
  }
});

// Send timesheet reminder to specific user
router.post('/send-timesheet-reminder', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { userEmail, userName, date, hoursToLog } = req.body;
    
    if (!userEmail || !userName || !date) {
      res.status(400).json({
        success: false,
        error: 'User email, name, and date are required',
      });
      return;
    }

    const success = await EmailConfigService.sendTimesheetReminder(
      userEmail,
      userName,
      date,
      hoursToLog || '8'
    );
    
    res.json({
      success: true,
      data: { success },
      message: success ? 'Timesheet reminder sent successfully' : 'Failed to send timesheet reminder',
    });
  } catch (error) {
    console.error('Error sending timesheet reminder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send timesheet reminder',
    });
  }
});

// Send welcome email
router.post('/send-welcome-email', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { userEmail, userName, role } = req.body;
    
    if (!userEmail || !userName || !role) {
      res.status(400).json({
        success: false,
        error: 'User email, name, and role are required',
      });
      return;
    }

    const success = await EmailConfigService.sendWelcomeEmail(userEmail, userName, role);
    
    res.json({
      success: true,
      data: { success },
      message: success ? 'Welcome email sent successfully' : 'Failed to send welcome email',
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send welcome email',
    });
  }
});

// Get email templates
// router.get('/templates', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
//   try {
//     const templates = await EmailConfigService.getTemplates();
//     
//     res.json({
//       success: true,
//       data: templates,
//     });
//   } catch (error) {
//     console.error('Error fetching email templates:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch email templates',
//     });
//   }
// });

export default router;
