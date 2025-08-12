import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  mentions?: {
    id: string;
    mentionedUser: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }[];
}

export interface CreateCommentData {
  content: string;
  taskId: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface CommentStore {
  // State
  comments: TaskComment[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchComments: (taskId: string) => Promise<void>;
  createComment: (data: CreateCommentData) => Promise<void>;
  updateComment: (id: string, data: UpdateCommentData) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  clearError: () => void;
}

const API_BASE = 'http://localhost:5000/api';

export const useCommentStore = create<CommentStore>((set, get) => ({
  // State
  comments: [],
  isLoading: false,
  error: null,

  // Actions
  fetchComments: async (taskId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/comments/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments');
      }

      set({
        comments: data.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch comments',
      });
    }
  },

  createComment: async (data: CreateCommentData) => {
    set({ isLoading: true, error: null });
    
    try {
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create comment');
      }

      // Refresh comments list
      await get().fetchComments(data.taskId);
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create comment',
      });
    }
  },

  updateComment: async (id: string, data: UpdateCommentData) => {
    set({ isLoading: true, error: null });
    
    try {
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/comments/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update comment');
      }

      // Update the comment in the local state
      set(state => ({
        comments: state.comments.map(comment => 
          comment.id === id ? responseData.data : comment
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update comment',
      });
    }
  },

  deleteComment: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/comments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete comment');
      }

      // Remove the comment from the local state
      set(state => ({
        comments: state.comments.filter(comment => comment.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete comment',
      });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));
