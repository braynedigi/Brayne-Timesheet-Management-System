import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'EMAIL' | 'PUSH' | 'SMS' | 'IN_APP';
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  data?: Record<string, any>;
  readAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  
  // Actions
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  sendTestNotification: (type: string, title: string, message: string) => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void;
  removeNotification: (notificationId: string) => void;
}

const API_BASE = 'http://localhost:5000/api';

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 20,

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/notifications?page=${page}&limit=${get().limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }

      set({
        notifications: data.data.notifications,
        total: data.data.total,
        page: data.data.page,
        totalPages: data.data.totalPages,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        return;
      }

      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        set({ unreadCount: data.data.count });
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark notification as read');
      }

      // Update the notification in the store
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, status: 'READ', readAt: new Date().toISOString() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to mark notification as read',
      });
    }
  },

  markAllAsRead: async () => {
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark all notifications as read');
      }

      // Update all notifications in the store
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.status !== 'READ'
            ? { ...notification, status: 'READ', readAt: new Date().toISOString() }
            : notification
        ),
        unreadCount: 0,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
      });
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete notification');
      }

      // Remove the notification from the store
      set((state) => {
        const notification = state.notifications.find((n) => n.id === notificationId);
        const wasUnread = notification && notification.status !== 'READ';
        
        return {
          notifications: state.notifications.filter((n) => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete notification',
      });
    }
  },

  sendTestNotification: async (type: string, title: string, message: string) => {
    try {
      // Check and refresh token if needed
      const tokenValid = await useAuthStore.getState().checkAndRefreshToken();
      if (!tokenValid) {
        throw new Error('Authentication required');
      }

      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/notifications/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, title, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test notification');
      }

      // Add the new notification to the store
      set((state) => ({
        notifications: [data.data, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send test notification',
      });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.status !== 'READ' ? state.unreadCount + 1 : state.unreadCount,
    }));
  },

  updateNotification: (notificationId: string, updates: Partial<Notification>) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, ...updates } : notification
      ),
    }));
  },

  removeNotification: (notificationId: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === notificationId);
      const wasUnread = notification && notification.status !== 'READ';
      
      return {
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },
}));
