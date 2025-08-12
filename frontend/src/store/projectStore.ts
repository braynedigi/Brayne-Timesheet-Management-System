import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface Project {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
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

export interface CreateProjectData {
  name: string;
  description?: string;
  clientId: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  clientId?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}

interface ProjectActions {
  fetchProjects: () => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<void>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
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

  createProject: async (data: CreateProjectData) => {
    set({ isLoading: true, error: null });
    
    try {
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create project');
      }

      // Refresh projects list
      await get().fetchProjects();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      });
    }
  },

  updateProject: async (id: string, data: UpdateProjectData) => {
    set({ isLoading: true, error: null });
    
    try {
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update project');
      }

      // Refresh projects list
      await get().fetchProjects();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update project',
      });
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to delete project');
      }

      // Refresh projects list
      await get().fetchProjects();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete project',
      });
    }
  },
}));
