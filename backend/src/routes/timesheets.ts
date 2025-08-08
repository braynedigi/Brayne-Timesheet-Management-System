import express from 'express';
import { z } from 'zod';
import { TimesheetService } from '../services/timesheetService';
import { authenticateToken, requireEmployee } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const createTimesheetSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  hours: z.number().min(0.1).max(24),
  taskName: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  type: z.enum(['WORK', 'MEETING', 'RESEARCH', 'TRAINING', 'BREAK', 'OTHER']),
  projectId: z.string().min(1, 'Project is required'),
});

const updateTimesheetSchema = z.object({
  date: z.string().transform((str) => new Date(str)).optional(),
  hours: z.number().min(0.1).max(24).optional(),
  taskName: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['WORK', 'MEETING', 'RESEARCH', 'TRAINING', 'BREAK', 'OTHER']).optional(),
  projectId: z.string().min(1).optional(),
});

const timesheetFiltersSchema = z.object({
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  type: z.enum(['WORK', 'MEETING', 'RESEARCH', 'TRAINING', 'BREAK', 'OTHER']).optional(),
  page: z.string().transform((str) => parseInt(str, 10)).optional(),
  limit: z.string().transform((str) => parseInt(str, 10)).optional(),
});

// GET /api/timesheets - Get timesheets with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const validatedFilters = timesheetFiltersSchema.parse(req.query);
    const page = validatedFilters.page || 1;
    const limit = validatedFilters.limit || 20;

    // If not admin, only show user's own timesheets
    if (req.user!.role !== 'ADMIN') {
      validatedFilters.userId = req.user!.id;
    }

    const result = await TimesheetService.getTimesheets(validatedFilters, page, limit);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch timesheets',
    });
  }
});

// GET /api/timesheets/:id - Get specific timesheet
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const timesheet = await TimesheetService.getTimesheetById(id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        error: 'Timesheet not found',
      });
    }

    // Check if user has permission to view this timesheet
    if (req.user!.role !== 'ADMIN' && timesheet.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    return res.json({
      success: true,
      data: timesheet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch timesheet',
    });
  }
});

// POST /api/timesheets - Create new timesheet
router.post('/', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const validatedData = createTimesheetSchema.parse(req.body);
    
    const timesheet = await TimesheetService.createTimesheet({
      ...validatedData,
      userId: req.user!.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Timesheet created successfully',
      data: timesheet,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create timesheet',
    });
  }
});

// PUT /api/timesheets/:id - Update timesheet
router.put('/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateTimesheetSchema.parse(req.body);

    // Check if timesheet exists and user has permission
    const existingTimesheet = await TimesheetService.getTimesheetById(id);
    if (!existingTimesheet) {
      return res.status(404).json({
        success: false,
        error: 'Timesheet not found',
      });
    }

    if (req.user!.role !== 'ADMIN' && existingTimesheet.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const timesheet = await TimesheetService.updateTimesheet(id, validatedData);

    return res.json({
      success: true,
      message: 'Timesheet updated successfully',
      data: timesheet,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update timesheet',
    });
  }
});

// DELETE /api/timesheets/:id - Delete timesheet
router.delete('/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if timesheet exists and user has permission
    const existingTimesheet = await TimesheetService.getTimesheetById(id);
    if (!existingTimesheet) {
      return res.status(404).json({
        success: false,
        error: 'Timesheet not found',
      });
    }

    if (req.user!.role !== 'ADMIN' && existingTimesheet.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await TimesheetService.deleteTimesheet(id);

    return res.json({
      success: true,
      message: 'Timesheet deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete timesheet',
    });
  }
});

// GET /api/timesheets/summary - Get timesheet summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = timesheetFiltersSchema.parse(req.query);

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    let summary;
    if (req.user!.role === 'ADMIN') {
      summary = await TimesheetService.getAdminTimesheetSummary(startDate, endDate);
    } else {
      summary = await TimesheetService.getTimesheetSummary(req.user!.id, startDate, endDate);
    }

    return res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch summary',
    });
  }
});

export default router;
