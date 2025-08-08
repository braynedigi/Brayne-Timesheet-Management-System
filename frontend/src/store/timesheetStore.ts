import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface Timesheet {
  id: string;
  date: string;
  hoursWorked: string;
  taskName: string;
  description?: string;
  type: 'WORK' | 'MEETING' | 'RESEARCH' | 'TRAINING' | 'BREAK' | 'OTHER';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface CreateTimesheetData {
  date: string;
  hours: number;
  taskName: string;
  description?: string;
  type: 'WORK' | 'MEETING' | 'RESEARCH' | 'TRAINING' | 'BREAK' | 'OTHER';
  projectId: string;
}

export interface UpdateTimesheetData {
  date?: string;
  hours?: number;
  taskName?: string;
  description?: string;
  type?: 'WORK' | 'MEETING' | 'RESEARCH' | 'TRAINING' | 'BREAK' | 'OTHER';
  projectId?: string;
}

export interface TimesheetFilters {
  startDate?: string;
  endDate?: string;
  type?: string;
  projectId?: string;
  userId?: string;
  clientId?: string;
}

interface TimesheetState {
  timesheets: Timesheet[];
  currentTimesheet: Timesheet | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

interface TimesheetActions {
  fetchTimesheets: (filters?: TimesheetFilters, page?: number) => Promise<void>;
  createTimesheet: (data: CreateTimesheetData) => Promise<void>;
  updateTimesheet: (id: string, data: UpdateTimesheetData) => Promise<void>;
  deleteTimesheet: (id: string) => Promise<void>;
  getTimesheetById: (id: string) => Promise<void>;
  clearCurrentTimesheet: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type TimesheetStore = TimesheetState & TimesheetActions;

const API_BASE = 'http://localhost:5000/api';

export const useTimesheetStore = create<TimesheetStore>((set, get) => ({
  // State
  timesheets: [],
  currentTimesheet: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 10,

  // Actions
  fetchTimesheets: async (filters = {}, page = 1) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: get().limit.toString(),
        ...filters,
      });

      const response = await fetch(`${API_BASE}/timesheets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch timesheets');
      }

      set({
        timesheets: data.data.timesheets,
        total: data.data.total,
        page: data.data.page,
        totalPages: data.data.totalPages,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch timesheets',
      });
    }
  },

  createTimesheet: async (data: CreateTimesheetData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/timesheets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create timesheet');
      }

      // Refresh the timesheets list
      await get().fetchTimesheets();
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create timesheet',
      });
    }
  },

  updateTimesheet: async (id: string, data: UpdateTimesheetData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/timesheets/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update timesheet');
      }

      // Refresh the timesheets list
      await get().fetchTimesheets();
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update timesheet',
      });
    }
  },

  deleteTimesheet: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/timesheets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to delete timesheet');
      }

      // Refresh the timesheets list
      await get().fetchTimesheets();
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete timesheet',
      });
    }
  },

  getTimesheetById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/timesheets/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch timesheet');
      }

      set({
        currentTimesheet: data.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch timesheet',
      });
    }
  },

  clearCurrentTimesheet: () => {
    set({ currentTimesheet: null });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));
