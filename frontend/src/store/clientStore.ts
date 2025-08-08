import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    projects: number;
  };
}

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ClientFilters {
  search?: string;
  isActive?: boolean;
}

interface ClientState {
  clients: Client[];
  currentClient: Client | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

interface ClientActions {
  fetchClients: (filters?: ClientFilters, page?: number) => Promise<void>;
  createClient: (data: CreateClientData) => Promise<void>;
  updateClient: (id: string, data: UpdateClientData) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientById: (id: string) => Promise<void>;
  clearCurrentClient: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type ClientStore = ClientState & ClientActions;

const API_BASE = 'http://localhost:5000/api';

export const useClientStore = create<ClientStore>((set, get) => ({
  // State
  clients: [],
  currentClient: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 10,

  // Actions
  fetchClients: async (filters = {}, page = 1) => {
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

      const response = await fetch(`${API_BASE}/clients?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch clients');
      }

      set({
        clients: data.data.clients,
        total: data.data.total,
        page: data.data.page,
        totalPages: data.data.totalPages,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch clients',
      });
    }
  },

  createClient: async (data: CreateClientData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create client');
      }

      // Refresh the clients list
      await get().fetchClients();
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create client',
      });
    }
  },

  updateClient: async (id: string, data: UpdateClientData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update client');
      }

      // Refresh the clients list
      await get().fetchClients();
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update client',
      });
    }
  },

  deleteClient: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to delete client');
      }

      // Refresh the clients list
      await get().fetchClients();
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete client',
      });
    }
  },

  getClientById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;

      const response = await fetch(`${API_BASE}/clients/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch client');
      }

      set({
        currentClient: data.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch client',
      });
    }
  },

  clearCurrentClient: () => {
    set({ currentClient: null });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));
