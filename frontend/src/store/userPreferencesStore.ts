import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

export interface UserPreferences {
  // Display preferences
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  numberFormat: string;
  compactMode: boolean;
  showAnimations: boolean;
  sidebarCollapsed: boolean;
  
  // Notification preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  timesheetReminders: boolean;
  weeklyReports: boolean;
  dailyDigest: boolean;
  projectUpdates: boolean;
  clientNotifications: boolean;
  reminderTime: string;
  reminderDays: string[];
  
  // Security preferences
  sessionTimeout: number;
  requirePasswordChange: boolean;
  twoFactorAuth: boolean;
  
  // Custom preferences
  customSettings: Record<string, any>;
}

interface UserPreferencesState {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  deviceId: string;
  
  // Actions
  fetchPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  syncPreferences: () => Promise<void>;
  resetPreferences: () => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  generateDeviceId: () => string;
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  currency: 'USD',
  numberFormat: '1,234.56',
  compactMode: false,
  showAnimations: true,
  sidebarCollapsed: false,
  emailNotifications: true,
  pushNotifications: false,
  timesheetReminders: true,
  weeklyReports: false,
  dailyDigest: false,
  projectUpdates: true,
  clientNotifications: true,
  reminderTime: '09:00',
  reminderDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  sessionTimeout: 30,
  requirePasswordChange: false,
  twoFactorAuth: false,
  customSettings: {},
};

const API_BASE = 'http://localhost:5000/api';

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: null,
      isLoading: false,
      error: null,
      lastSync: null,
      deviceId: '',

      generateDeviceId: () => {
        const existingId = localStorage.getItem('device-id');
        if (existingId) {
          return existingId;
        }
        
        const newId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('device-id', newId);
        return newId;
      },

      fetchPreferences: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Check and refresh token if needed
          const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
          if (!tokenValid) {
            throw new Error('Authentication required');
          }

          const token = useAuthStore.getState().token;
          const response = await fetch(`${API_BASE}/preferences`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch preferences');
          }

          set({
            preferences: data.data,
            lastSync: new Date(),
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch preferences',
          });
        }
      },

      updatePreferences: async (updates: Partial<UserPreferences>) => {
        set({ isLoading: true, error: null });
        
        try {
          // Check and refresh token if needed
          const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
          if (!tokenValid) {
            throw new Error('Authentication required');
          }

          const token = useAuthStore.getState().token;
          const response = await fetch(`${API_BASE}/preferences`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to update preferences');
          }

          set((state) => ({
            preferences: data.data,
            lastSync: new Date(),
            isLoading: false,
          }));
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update preferences',
          });
        }
      },

      syncPreferences: async () => {
        const { preferences, deviceId } = get();
        
        if (!preferences) {
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          // Check and refresh token if needed
          const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
          if (!tokenValid) {
            throw new Error('Authentication required');
          }

          const token = useAuthStore.getState().token;
          const response = await fetch(`${API_BASE}/preferences/sync`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceId,
              preferences,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to sync preferences');
          }

          set({
            preferences: data.data,
            lastSync: new Date(),
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to sync preferences',
          });
        }
      },

      resetPreferences: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Check and refresh token if needed
          const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
          if (!tokenValid) {
            throw new Error('Authentication required');
          }

          const token = useAuthStore.getState().token;
          const response = await fetch(`${API_BASE}/preferences/reset`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to reset preferences');
          }

          set({
            preferences: data.data,
            lastSync: new Date(),
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to reset preferences',
          });
        }
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'user-preferences',
      partialize: (state) => ({
        preferences: state.preferences,
        lastSync: state.lastSync,
        deviceId: state.deviceId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Generate device ID if not exists
          if (!state.deviceId) {
            state.deviceId = state.generateDeviceId();
          }
        }
      },
    }
  )
);
