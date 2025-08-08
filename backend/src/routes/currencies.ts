import express from 'express';
import { CustomCurrencyService, CustomCurrencySchema, CustomCurrencyUpdateSchema } from '../services/customCurrencyService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all custom currencies for the user
router.get('/', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const currencies = await CustomCurrencyService.getUserCustomCurrencies(userId);
    
    res.json({
      success: true,
      data: currencies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch currencies',
    });
  }
});

// Get built-in currencies
router.get('/built-in', authenticateToken, async (req, res): Promise<void> => {
  try {
    const currencies = CustomCurrencyService.getBuiltInCurrencies();
    
    res.json({
      success: true,
      data: currencies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch built-in currencies',
    });
  }
});

// Get a specific custom currency
router.get('/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    
    const currency = await CustomCurrencyService.getCustomCurrencyById(id, userId);
    
    if (!currency) {
      res.status(404).json({
        success: false,
        message: 'Currency not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: currency,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch currency',
    });
  }
});

// Create a new custom currency
router.post('/', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const validatedData = CustomCurrencySchema.parse(req.body);
    
    const currency = await CustomCurrencyService.createCustomCurrency(userId, validatedData);
    
    res.status(201).json({
      success: true,
      data: currency,
      message: 'Currency created successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create currency',
    });
  }
});

// Update a custom currency
router.put('/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const validatedData = CustomCurrencyUpdateSchema.parse(req.body);
    
    const currency = await CustomCurrencyService.updateCustomCurrency(id, userId, validatedData);
    
    res.json({
      success: true,
      data: currency,
      message: 'Currency updated successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update currency',
    });
  }
});

// Delete a custom currency
router.delete('/:id', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    
    await CustomCurrencyService.deleteCustomCurrency(id, userId);
    
    res.json({
      success: true,
      message: 'Currency deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    if (error instanceof Error && error.message.includes('currently in use')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete currency',
    });
  }
});

// Set a currency as default
router.patch('/:id/set-default', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    
    const currency = await CustomCurrencyService.setDefaultCurrency(id, userId);
    
    res.json({
      success: true,
      data: currency,
      message: 'Default currency set successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to set default currency',
    });
  }
});

// Convert amount between currencies
router.post('/convert', authenticateToken, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { amount, fromCurrencyId, toCurrencyId } = req.body;
    
    if (!amount || !fromCurrencyId || !toCurrencyId) {
      res.status(400).json({
        success: false,
        message: 'Amount, fromCurrencyId, and toCurrencyId are required',
      });
      return;
    }
    
    const convertedAmount = await CustomCurrencyService.convertAmount(
      Number(amount),
      fromCurrencyId,
      toCurrencyId,
      userId
    );
    
    res.json({
      success: true,
      data: {
        originalAmount: amount,
        convertedAmount,
        fromCurrencyId,
        toCurrencyId,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to convert amount',
    });
  }
});

export default router;
