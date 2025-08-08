import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';

interface BrandingContextType {
  applyBranding: () => void;
  isBrandingApplied: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

interface BrandingProviderProps {
  children: React.ReactNode;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
  const { settings, fetchSettings } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const [isBrandingApplied, setIsBrandingApplied] = useState(false);

  const applyBranding = () => {
    const root = document.documentElement;
    const head = document.head;

    // Check if settings and branding exist
    if (!settings?.branding) {
      console.warn('Settings or branding not available yet');
      return;
    }

    // Apply CSS custom properties with fallbacks
    root.style.setProperty('--primary-color', settings.branding.primaryColor || '#3B82F6');
    root.style.setProperty('--secondary-color', settings.branding.secondaryColor || '#10B981');
    root.style.setProperty('--button-color', settings.branding.buttonColor || '#3B82F6');
    root.style.setProperty('--accent-color', settings.branding.accentColor || '#F59E0B');
    root.style.setProperty('--background-color', settings.branding.backgroundColor || '#FFFFFF');
    root.style.setProperty('--text-color', settings.branding.textColor || '#1F2937');
    root.style.setProperty('--border-radius', settings.branding.borderRadius || '0.375rem');
    root.style.setProperty('--font-family', settings.branding.fontFamily || 'Inter');
    root.style.setProperty('--font-size', settings.branding.fontSize || '14px');

    // Apply favicon
    if (settings.branding.faviconUrl) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        head.appendChild(favicon);
      }
      favicon.href = settings.branding.faviconUrl;
    }

    // Apply logo to page title
    if (settings.branding.logoUrl) {
      // You can add logo to specific elements here if needed
      // For example, updating a logo in the header
      const logoElements = document.querySelectorAll('[data-branding-logo]');
      logoElements.forEach((element) => {
        if (element instanceof HTMLImageElement) {
          element.src = settings.branding.logoUrl;
        }
      });
    }

    // Update page title
    document.title = settings.branding.softwareName || 'Timesheet Management System';

    setIsBrandingApplied(true);
  };

  useEffect(() => {
    // Only fetch settings if user is authenticated
    if (isAuthenticated) {
      fetchSettings().then(() => {
        applyBranding();
      }).catch((error) => {
        console.warn('Failed to fetch settings:', error);
        // Apply default branding even if fetch fails
        applyBranding();
      });
    } else {
      // Apply default branding for non-authenticated users
      applyBranding();
    }
  }, [isAuthenticated, fetchSettings]);

  useEffect(() => {
    if (settings?.branding) {
      applyBranding();
      // Force a re-render of the entire app to apply new colors
      window.dispatchEvent(new Event('branding-updated'));
    }
  }, [settings?.branding]);

  return (
    <BrandingContext.Provider value={{ applyBranding, isBrandingApplied }}>
      {children}
    </BrandingContext.Provider>
  );
};
