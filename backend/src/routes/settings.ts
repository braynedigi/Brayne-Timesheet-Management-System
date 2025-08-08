import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { getSettings, updateSettings, uploadFile } from '../services/settingsService';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Validation schemas
const brandingSchema = z.object({
  softwareName: z.string().min(1).max(100).optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  buttonColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  textColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  borderRadius: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.string().optional(),
});

const footerSchema = z.object({
  enabled: z.boolean().optional(),
  text: z.string().optional(),
  links: z.array(z.object({
    label: z.string(),
    url: z.string().url(),
  })).optional(),
});

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  timesheetReminders: z.boolean(),
  weeklyReports: z.boolean(),
  dailyDigest: z.boolean(),
  projectUpdates: z.boolean(),
  clientNotifications: z.boolean(),
  reminderTime: z.string(),
  reminderDays: z.array(z.string()),
  emailTemplate: z.string(),
  pushNotifications: z.boolean(),
});

const displaySchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.string(),
  timezone: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string(),
  currency: z.string(),
  numberFormat: z.string(),
  compactMode: z.boolean(),
  showAnimations: z.boolean(),
  sidebarCollapsed: z.boolean(),
});

const securitySchema = z.object({
  sessionTimeout: z.number().min(300).max(86400),
  requirePasswordChange: z.boolean(),
  twoFactorAuth: z.boolean(),
  passwordMinLength: z.number().min(6).max(50),
  passwordComplexity: z.string(),
  loginAttempts: z.number().min(1).max(10),
  lockoutDuration: z.number().min(300).max(3600),
  ipWhitelist: z.array(z.string()),
  auditLogging: z.boolean(),
  dataEncryption: z.boolean(),
});

const systemSchema = z.object({
  autoBackup: z.boolean(),
  backupFrequency: z.string(),
  retentionPeriod: z.number().min(1).max(365),
  maintenanceMode: z.boolean(),
  debugMode: z.boolean(),
  logLevel: z.string(),
  maxFileSize: z.number().min(1024).max(10485760),
  allowedFileTypes: z.array(z.string()),
  dataRetention: z.number().min(30).max(3650),
  performanceMode: z.boolean(),
});

// Get all settings
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const settings = await getSettings();
    return res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
    });
  }
});

// Update branding settings
router.put('/branding', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const validatedData = brandingSchema.parse(req.body);
    const updatedSettings = await updateSettings('branding', validatedData);
    
    return res.json({
      success: true,
      data: updatedSettings,
      message: 'Branding settings updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    } else {
      console.error('Error updating branding settings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update branding settings',
      });
    }
  }
});

// Update footer settings
router.put('/footer', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const validatedData = footerSchema.parse(req.body);
    const updatedSettings = await updateSettings('footer', validatedData);
    
    return res.json({
      success: true,
      data: updatedSettings,
      message: 'Footer settings updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    } else {
      console.error('Error updating footer settings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update footer settings',
      });
    }
  }
});

// Update notification settings
router.put('/notifications', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const validatedData = notificationsSchema.parse(req.body);
    const updatedSettings = await updateSettings('notifications', validatedData);
    
    return res.json({
      success: true,
      data: updatedSettings,
      message: 'Notification settings updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    } else {
      console.error('Error updating notification settings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update notification settings',
      });
    }
  }
});

// Update display settings
router.put('/display', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const validatedData = displaySchema.parse(req.body);
    const updatedSettings = await updateSettings('display', validatedData);
    
    return res.json({
      success: true,
      data: updatedSettings,
      message: 'Display settings updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    } else {
      console.error('Error updating display settings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update display settings',
      });
    }
  }
});

// Update security settings
router.put('/security', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const validatedData = securitySchema.parse(req.body);
    const updatedSettings = await updateSettings('security', validatedData);
    
    return res.json({
      success: true,
      data: updatedSettings,
      message: 'Security settings updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    } else {
      console.error('Error updating security settings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update security settings',
      });
    }
  }
});

// Update system settings
router.put('/system', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const validatedData = systemSchema.parse(req.body);
    const updatedSettings = await updateSettings('system', validatedData);
    
    return res.json({
      success: true,
      data: updatedSettings,
      message: 'System settings updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    } else {
      console.error('Error updating system settings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update system settings',
      });
    }
  }
});

// Upload logo
router.post('/upload/logo', authenticateToken, requireRole(['ADMIN']), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const fileUrl = await uploadFile(req.file, 'logo');
    
    // Update settings with new logo URL
    const updatedSettings = await updateSettings('branding', { logoUrl: fileUrl });
    
    return res.json({
      success: true,
      data: {
        logoUrl: fileUrl,
        settings: updatedSettings,
      },
      message: 'Logo uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload logo',
    });
  }
});

// Upload favicon
router.post('/upload/favicon', authenticateToken, requireRole(['ADMIN']), upload.single('favicon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const fileUrl = await uploadFile(req.file, 'favicon');
    
    // Update settings with new favicon URL
    const updatedSettings = await updateSettings('branding', { faviconUrl: fileUrl });
    
    return res.json({
      success: true,
      data: {
        faviconUrl: fileUrl,
        settings: updatedSettings,
      },
      message: 'Favicon uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading favicon:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload favicon',
    });
  }
});

export default router;
