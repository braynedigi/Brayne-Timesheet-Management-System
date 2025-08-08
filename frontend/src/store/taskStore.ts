import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  project: {
    id: string;
    name: string;
  };
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

export interface CreateTaskData {
  name: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number;
  dueDate?: string;
  assignedTo?: string;
  projectId: string;
}

export interface UpdateTaskData {
  name?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  assignedTo?: string;
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

interface TaskActions {
  fetchTasks: (projectId?: string) => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => Promise<void>;
  clearCurrentTask: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type TaskStore = TaskState & TaskActions;

const API_BASE = 'http://localhost:5000/api';

export const useTaskStore = create<TaskStore>((set, get) => ({
  // State
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,

  // Actions
  fetchTasks: async (projectId?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;
      const url = projectId 
        ? `${API_BASE}/tasks?projectId=${projectId}`
        : `${API_BASE}/tasks`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }

      set({
        tasks: data.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
      });
    }
  },

  createTask: async (data: CreateTaskData) => {
    set({ isLoading: true, error: null });
    
    try {
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create task');
      }

      // Refresh tasks list
      await get().fetchTasks(data.projectId);
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create task',
      });
    }
  },

  updateTask: async (id: string, data: UpdateTaskData) => {
    set({ isLoading: true, error: null });
    
    try {
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update task');
      }

      // Refresh tasks list
      await get().fetchTasks();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update task',
      });
    }
  },

  deleteTask: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task');
      }

      // Refresh tasks list
      await get().fetchTasks();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete task',
      });
    }
  },

  getTaskById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch task');
      }

      set({
        currentTask: data.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch task',
      });
    }
  },

  clearCurrentTask: () => {
    set({ currentTask: null });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));
