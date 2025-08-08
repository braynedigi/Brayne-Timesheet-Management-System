import express from 'express';
import { z } from 'zod';
import { NotificationService, NotificationSchema } from '../services/notificationService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await NotificationService.getUserNotifications(userId, page, limit);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
});

// Get unread notifications count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const count = await NotificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const notificationId = req.params.id;
    
    const notification = await NotificationService.markAsRead(notificationId, userId);
    
    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await NotificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
    });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const notificationId = req.params.id;
    
    await NotificationService.deleteNotification(notificationId, userId);
    
    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
    });
  }
});

// Send test notification
router.post('/test', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { type = 'email', title, message } = req.body;
    
    let notification;
    
    if (type === 'email') {
      notification = await NotificationService.sendEmailNotification(
        userId,
        title || 'Test Notification',
        message || 'This is a test notification'
      );
    } else if (type === 'push') {
      notification = await NotificationService.sendPushNotification(
        userId,
        title || 'Test Notification',
        message || 'This is a test notification'
      );
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid notification type',
      });
      return;
    }
    
    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
    });
  }
});

// Send timesheet reminder
router.post('/timesheet-reminder', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const notification = await NotificationService.sendTimesheetReminder(userId);
    
    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error sending timesheet reminder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send timesheet reminder',
    });
  }
});

// Send weekly report
router.post('/weekly-report', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { reportData } = req.body;
    
    const notification = await NotificationService.sendWeeklyReport(userId, reportData);
    
    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error sending weekly report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send weekly report',
    });
  }
});

// Send project update notification
router.post('/project-update', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { projectName, updateMessage } = req.body;
    
    if (!projectName || !updateMessage) {
      res.status(400).json({
        success: false,
        error: 'Project name and update message are required',
      });
      return;
    }
    
    const notification = await NotificationService.sendProjectUpdate(userId, projectName, updateMessage);
    
    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error sending project update notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send project update notification',
    });
  }
});

export default router;
