import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface Project {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  _count?: {
    timesheets: number;
  };
}

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}

interface ProjectActions {
  fetchProjects: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type ProjectStore = ProjectState & ProjectActions;

const API_BASE = 'http://localhost:5000/api';

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // State
  projects: [],
  isLoading: false,
  error: null,

  // Actions
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }

      set({
        projects: data.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
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
