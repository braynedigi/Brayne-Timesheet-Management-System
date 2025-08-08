import { Router } from 'express';
import { z } from 'zod';
import { UserService } from '../services/userService';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'EMPLOYEE', 'CLIENT']),
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE', 'CLIENT']).optional(),
  isActive: z.boolean().optional(),
});

const userFiltersSchema = z.object({
  role: z.enum(['ADMIN', 'EMPLOYEE', 'CLIENT']).optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional(),
  page: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
});

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/users - Get all users with filters and pagination
router.get('/', async (req, res) => {
  try {
    const filters = userFiltersSchema.parse(req.query);
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const result = await UserService.getUsers(filters, page, limit);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user',
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await UserService.createUser(data);

    return res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);
    const user = await UserService.updateUser(id, data);

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await UserService.deleteUser(id);

    return res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    });
  }
});

// GET /api/users/:id/stats - Get user statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await UserService.getUserStats(id);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user stats',
    });
  }
});

export default router;
