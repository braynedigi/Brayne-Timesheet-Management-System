import express from 'express';
import { z } from 'zod';
import { UserPreferencesService, UserPreferencesSchema } from '../services/userPreferencesService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get user preferences
router.get('/', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const preferences = await UserPreferencesService.getUserPreferences(userId);
    
    if (!preferences) {
      // Return default preferences if none exist
      const defaultPreferences = UserPreferencesService.getDefaultPreferences();
      res.json({
        success: true,
        data: defaultPreferences,
      });
      return;
    }

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user preferences',
    });
  }
});

// Create or update user preferences
router.post('/', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const validationResult = UserPreferencesSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid preferences data',
        details: validationResult.error.errors,
      });
      return;
    }

    const preferences = await UserPreferencesService.upsertUserPreferences(userId, validationResult.data);
    
    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save user preferences',
    });
  }
});

// Update specific preference fields
router.patch('/', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const validationResult = UserPreferencesSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid preferences data',
        details: validationResult.error.errors,
      });
      return;
    }

    const preferences = await UserPreferencesService.updateUserPreferences(userId, validationResult.data);
    
    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user preferences',
    });
  }
});

// Sync preferences across devices
router.post('/sync', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { deviceId, preferences } = req.body;
    
    if (!deviceId) {
      res.status(400).json({
        success: false,
        error: 'Device ID is required',
      });
      return;
    }

    const validationResult = UserPreferencesSchema.safeParse(preferences);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid preferences data',
        details: validationResult.error.errors,
      });
      return;
    }

    const syncedPreferences = await UserPreferencesService.syncPreferences(userId, deviceId, validationResult.data);
    
    res.json({
      success: true,
      data: syncedPreferences,
    });
  } catch (error) {
    console.error('Error syncing preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync preferences',
    });
  }
});

// Reset preferences to default
router.post('/reset', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const defaultPreferences = UserPreferencesService.getDefaultPreferences();
    const preferences = await UserPreferencesService.upsertUserPreferences(userId, defaultPreferences);
    
    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error resetting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset preferences',
    });
  }
});

// Delete user preferences
router.delete('/', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    await UserPreferencesService.deleteUserPreferences(userId);
    
    res.json({
      success: true,
      message: 'Preferences deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete preferences',
    });
  }
});

export default router;
