import express from 'express';
import { z } from 'zod';
import { TaskService, CreateTaskData, UpdateTaskData, TaskFilters } from '../services/taskService';
import { authenticateToken, requireEmployee } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const createTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  assignedTo: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
});

const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  assignedTo: z.string().optional(),
});

const taskFiltersSchema = z.object({
  projectId: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
});

// GET /api/tasks - Get tasks with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const validatedFilters = taskFiltersSchema.parse(req.query);
    
    const tasks = await TaskService.getTasks(validatedFilters);

    return res.json({
      success: true,
      data: tasks,
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
      error: error instanceof Error ? error.message : 'Failed to fetch tasks',
    });
  }
});

// GET /api/tasks/:id - Get task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await TaskService.getTaskById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    return res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch task',
    });
  }
});

// POST /api/tasks - Create new task
router.post('/', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const validatedData = createTaskSchema.parse(req.body);
    
    const task = await TaskService.createTask(validatedData);

    return res.status(201).json({
      success: true,
      data: task,
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
      error: error instanceof Error ? error.message : 'Failed to create task',
    });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateTaskSchema.parse(req.body);
    
    const task = await TaskService.updateTask(id, validatedData);

    return res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message === 'Task not found') {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task',
    });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    await TaskService.deleteTask(id);

    return res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete task',
    });
  }
});

// GET /api/tasks/project/:projectId - Get tasks by project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const tasks = await TaskService.getTasksByProject(projectId);

    return res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project tasks',
    });
  }
});

// GET /api/tasks/statistics - Get task statistics
router.get('/statistics/:projectId?', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const stats = await TaskService.getTaskStatistics(projectId);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch task statistics',
    });
  }
});

export default router;
