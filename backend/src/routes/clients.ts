import { Router } from 'express';
import { z } from 'zod';
import { ClientService } from '../services/clientService';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Validation schemas
const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const updateClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const clientFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  page: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/clients - Get all clients with filters and pagination (allow authenticated users for project work)
router.get('/', async (req, res) => {
  try {
    const filters = clientFiltersSchema.parse(req.query);
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const result = await ClientService.getClients(filters, page, limit);

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
      error: error instanceof Error ? error.message : 'Failed to fetch clients',
    });
  }
});

// GET /api/clients/:id - Get client by ID (allow authenticated users for project work)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await ClientService.getClientById(id);

    return res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch client',
    });
  }
});

// POST /api/clients - Create new client (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const data = createClientSchema.parse(req.body);
    const client = await ClientService.createClient(data);

    return res.status(201).json({
      success: true,
      data: client,
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
      error: error instanceof Error ? error.message : 'Failed to create client',
    });
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateClientSchema.parse(req.body);
    const client = await ClientService.updateClient(id, data);

    return res.json({
      success: true,
      data: client,
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
      error: error instanceof Error ? error.message : 'Failed to update client',
    });
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await ClientService.deleteClient(id);

    return res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete client',
    });
  }
});

// GET /api/clients/:id/stats - Get client statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await ClientService.getClientStats(id);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch client stats',
    });
  }
});

export default router;
