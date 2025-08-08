import express from 'express';
import { z } from 'zod';
import { ProjectService } from '../services/projectService';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  clientId: z.string().min(1).optional(),
});

// GET /api/projects - Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.query;
    
    const projects = await ProjectService.getProjects(clientId as string);

    return res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
    });
  }
});

// GET /api/projects/:id - Get specific project
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await ProjectService.getProjectById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    return res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project',
    });
  }
});

// POST /api/projects - Create new project
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);
    
    const project = await ProjectService.createProject(validatedData);

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
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
      error: error instanceof Error ? error.message : 'Failed to create project',
    });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateProjectSchema.parse(req.body);

    const project = await ProjectService.updateProject(id, validatedData);

    return res.json({
      success: true,
      message: 'Project updated successfully',
      data: project,
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
      error: error instanceof Error ? error.message : 'Failed to update project',
    });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await ProjectService.deleteProject(id);

    return res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    });
  }
});

// GET /api/projects/:id/stats - Get project statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await ProjectService.getProjectStats(id);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project statistics',
    });
  }
});

export default router;
