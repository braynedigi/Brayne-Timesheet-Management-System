import React from 'react';
import { useSettingsStore } from '@/store/settingsStore';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { settings } = useSettingsStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {settings.branding.logoUrl ? (
            <div className="flex justify-center">
              <img 
                src={settings.branding.logoUrl} 
                alt={settings.branding.softwareName}
                className="h-12 w-auto max-w-64 object-contain"
              />
            </div>
          ) : (
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              {settings.branding.softwareName}
            </h2>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
