import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface CustomCurrency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isDefault: boolean;
  isActive: boolean;
  exchangeRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuiltInCurrency {
  code: string;
  name: string;
  symbol: string;
}

interface CurrencyState {
  customCurrencies: CustomCurrency[];
  builtInCurrencies: BuiltInCurrency[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCustomCurrencies: () => Promise<void>;
  fetchBuiltInCurrencies: () => Promise<void>;
  createCustomCurrency: (data: Omit<CustomCurrency, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomCurrency: (id: string, data: Partial<CustomCurrency>) => Promise<void>;
  deleteCustomCurrency: (id: string) => Promise<void>;
  setDefaultCurrency: (id: string) => Promise<void>;
  convertAmount: (amount: number, fromCurrencyId: string, toCurrencyId: string) => Promise<number>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const API_BASE = 'http://localhost:5000/api';

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  customCurrencies: [],
  builtInCurrencies: [],
  isLoading: false,
  error: null,

  fetchCustomCurrencies: async () => {
    try {
      set({ isLoading: true, error: null });
      const { checkAndRefreshToken } = useAuthStore.getState();
      await checkAndRefreshToken();
      
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/currencies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch custom currencies');
      }

      const result = await response.json();
      set({ customCurrencies: result.data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch custom currencies' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBuiltInCurrencies: async () => {
    try {
      set({ isLoading: true, error: null });
      const { checkAndRefreshToken } = useAuthStore.getState();
      await checkAndRefreshToken();
      
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/currencies/built-in`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch built-in currencies');
      }

      const result = await response.json();
      set({ builtInCurrencies: result.data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch built-in currencies' });
    } finally {
      set({ isLoading: false });
    }
  },

  createCustomCurrency: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const { checkAndRefreshToken } = useAuthStore.getState();
      await checkAndRefreshToken();
      
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/currencies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create custom currency');
      }

      const result = await response.json();
      set(state => ({
        customCurrencies: [...state.customCurrencies, result.data],
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create custom currency' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCustomCurrency: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      const { checkAndRefreshToken } = useAuthStore.getState();
      await checkAndRefreshToken();
      
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/currencies/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update custom currency');
      }

      const result = await response.json();
      set(state => ({
        customCurrencies: state.customCurrencies.map(currency =>
          currency.id === id ? result.data : currency
        ),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update custom currency' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCustomCurrency: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const { checkAndRefreshToken } = useAuthStore.getState();
      await checkAndRefreshToken();
      
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/currencies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete custom currency');
      }

      set(state => ({
        customCurrencies: state.customCurrencies.filter(currency => currency.id !== id),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete custom currency' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setDefaultCurrency: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const { checkAndRefreshToken } = useAuthStore.getState();
      await checkAndRefreshToken();
      
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/currencies/${id}/set-default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set default currency');
      }

      const result = await response.json();
      set(state => ({
        customCurrencies: state.customCurrencies.map(currency => ({
          ...currency,
          isDefault: currency.id === id,
        })),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to set default currency' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  convertAmount: async (amount, fromCurrencyId, toCurrencyId) => {
    try {
      const { checkAndRefreshToken } = useAuthStore.getState();
      await checkAndRefreshToken();
      
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/currencies/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          fromCurrencyId,
          toCurrencyId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert amount');
      }

      const result = await response.json();
      return result.data.convertedAmount;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to convert amount' });
      throw error;
    }
  },

  setError: (error) => set({ error }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
