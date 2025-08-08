import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SystemSettings {
  branding: {
    softwareName: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    buttonColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
    fontFamily: string;
    fontSize: string;
  };
  footer: {
    enabled: boolean;
    text: string;
    links: Array<{ label: string; url: string }>;
  };
  notifications: {
    emailNotifications: boolean;
    timesheetReminders: boolean;
    weeklyReports: boolean;
    dailyDigest: boolean;
    projectUpdates: boolean;
    clientNotifications: boolean;
    reminderTime: string;
    reminderDays: string[];
    emailTemplate: string;
    pushNotifications: boolean;
  };
  display: {
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
  };
  security: {
    sessionTimeout: number;
    requirePasswordChange: boolean;
    twoFactorAuth: boolean;
    passwordMinLength: number;
    passwordComplexity: string;
    loginAttempts: number;
    lockoutDuration: number;
    ipWhitelist: string[];
    auditLogging: boolean;
    dataEncryption: boolean;
  };
  system: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionPeriod: number;
    maintenanceMode: boolean;
    debugMode: boolean;
    logLevel: string;
    maxFileSize: number;
    allowedFileTypes: string[];
    dataRetention: number;
    performanceMode: boolean;
  };
}

interface SettingsState {
  settings: SystemSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (section: keyof SystemSettings, updates: Partial<SystemSettings[keyof SystemSettings]>) => void;
  resetSettings: () => void;
  setError: (error: string | null) => void;
}

const defaultSettings: SystemSettings = {
  branding: {
    softwareName: 'Timesheet Management System',
    logoUrl: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    buttonColor: '#3B82F6',
    accentColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    borderRadius: '0.375rem',
    fontFamily: 'Inter',
    fontSize: '14px',
  },
  footer: {
    enabled: true,
    text: '© 2024 Timesheet Management System. All rights reserved.',
    links: [
      { label: 'Privacy Policy', url: '/privacy' },
      { label: 'Terms of Service', url: '/terms' },
      { label: 'Support', url: '/support' },
    ],
  },
  notifications: {
    emailNotifications: true,
    timesheetReminders: true,
    weeklyReports: false,
    dailyDigest: false,
    projectUpdates: true,
    clientNotifications: true,
    reminderTime: '09:00',
    reminderDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    emailTemplate: 'default',
    pushNotifications: false,
  },
  display: {
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
  },
  security: {
    sessionTimeout: 30,
    requirePasswordChange: false,
    twoFactorAuth: false,
    passwordMinLength: 8,
    passwordComplexity: 'medium',
    loginAttempts: 5,
    lockoutDuration: 15,
    ipWhitelist: [],
    auditLogging: true,
    dataEncryption: true,
  },
  system: {
    autoBackup: true,
    backupFrequency: 'daily',
    retentionPeriod: 30,
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info',
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'png', 'pdf', 'doc', 'docx'],
    dataRetention: 365,
    performanceMode: false,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isLoading: false,
      error: null,

      updateSettings: (section, updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [section]: { ...state.settings[section], ...updates }
          }
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: 'timesheet-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
