import express from 'express';
import { z } from 'zod';
import { CommentService, CreateCommentData, UpdateCommentData } from '../services/commentService';
import { authenticateToken, requireEmployee } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
  taskId: z.string().min(1, 'Task ID is required'),
});

const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
});

// GET /api/comments/task/:taskId - Get comments for a task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const comments = await CommentService.getTaskComments(taskId);

    return res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch comments',
    });
  }
});

// GET /api/comments/:id - Get comment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const comment = await CommentService.getCommentById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    return res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch comment',
    });
  }
});

// POST /api/comments - Create new comment
router.post('/', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const validatedData = createCommentSchema.parse(req.body);
    
    const commentData: CreateCommentData = {
      content: validatedData.content,
      taskId: validatedData.taskId,
      userId: req.user!.id,
    };

    const comment = await CommentService.createComment(commentData);

    return res.status(201).json({
      success: true,
      data: comment,
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
      error: error instanceof Error ? error.message : 'Failed to create comment',
    });
  }
});

// PUT /api/comments/:id - Update comment
router.put('/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateCommentSchema.parse(req.body);
    
    const comment = await CommentService.updateComment(id, validatedData, req.user!.id);

    return res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error && (error.message === 'Comment not found' || error.message === 'You can only edit your own comments')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update comment',
    });
  }
});

// DELETE /api/comments/:id - Delete comment
router.delete('/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    await CommentService.deleteComment(id, req.user!.id);

    return res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Comment not found' || error.message === 'You can only delete your own comments')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete comment',
    });
  }
});

// GET /api/comments/count/:taskId - Get comment count for a task
router.get('/count/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const count = await CommentService.getCommentCount(taskId);

    return res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get comment count',
    });
  }
});

export default router;
