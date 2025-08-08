import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUserPreferencesStore } from '@/store/userPreferencesStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrencyStore } from '@/store/currencyStore';
import CustomCurrencyManager from '@/components/CustomCurrencyManager';
import EmailConfiguration from '@/components/EmailConfiguration';
import {
  Settings,
  Upload,
  Palette,
  FileText,
  Bell,
  Shield,
  Save,
  X,
  Image,
  Type,
  Layout,
  Database,
  Clock,
  DollarSign,
  Lock,
  Zap,
  Monitor,
  Coins,
  Mail
} from 'lucide-react';



const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { settings, updateSettings, uploadLogo, uploadFavicon, fetchSettings, isLoading, error, setError } = useSettingsStore();
  const { preferences, updatePreferences, syncPreferences, resetPreferences } = useUserPreferencesStore();
  const { setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('branding');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string>('');

  // Add error boundary and debugging
  const [systemTabError, setSystemTabError] = useState<string | null>(null);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Debug system settings
  useEffect(() => {
    if (activeTab === 'system') {
      console.log('System tab activated, settings:', settings.system);
      setSystemTabError(null);
    }
  }, [activeTab, settings.system]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload immediately
      try {
        await uploadLogo(file);
        setLogoFile(null);
        setLogoPreview('');
      } catch (error) {
        console.error('Failed to upload logo:', error);
        setError('Failed to upload logo');
      }
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFaviconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload immediately
      try {
        await uploadFavicon(file);
        setFaviconFile(null);
        setFaviconPreview('');
      } catch (error) {
        console.error('Failed to upload favicon:', error);
        setError('Failed to upload favicon');
      }
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    updateSettings('branding', { logoUrl: '' });
  };

  const removeFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview('');
    updateSettings('branding', { faviconUrl: '' });
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [localFooterText, setLocalFooterText] = useState(settings.footer.text);
  const [localFooterLinks, setLocalFooterLinks] = useState(settings.footer.links);
  const [localBranding, setLocalBranding] = useState(settings.branding);

  // Update local state when settings change
  useEffect(() => {
    setLocalFooterText(settings.footer.text);
    setLocalFooterLinks(settings.footer.links);
    setLocalBranding(settings.branding);
  }, [settings.footer.text, settings.footer.links, settings.branding]);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // Save branding settings
      await updateSettings('branding', localBranding);
      // Save footer settings (text and links together)
      await updateSettings('footer', { 
        text: localFooterText,
        links: localFooterLinks 
      });
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000); // Clear success message after 3 seconds
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000); // Clear error message after 5 seconds
    }
  };



  const tabs = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'footer', label: 'Footer', icon: Layout },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database },
    { id: 'currencies', label: 'Currencies', icon: Coins },
    { id: 'preferences', label: 'User Preferences', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
  ];

  if (user?.role !== 'ADMIN') {
         return (
       <div className="space-y-6">
         <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
           <div className="flex">
             <div className="flex-shrink-0">
               <Shield className="h-5 w-5 text-red-400" />
             </div>
             <div className="ml-3">
               <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Access Denied</h3>
               <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                 Only administrators can access system settings.
               </div>
             </div>
           </div>
         </div>
       </div>
     );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure system branding, notifications, and security settings.
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Branding Settings */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div>
                                 <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Branding Configuration</h3>

                                 {/* Software Name */}
                 <div className="mb-6">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Software Name
                   </label>
                   <input
                     type="text"
                     value={localBranding.softwareName}
                     onChange={(e) => setLocalBranding({ ...localBranding, softwareName: e.target.value })}
                     className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     placeholder="Enter software name"
                   />
                 </div>

                                 {/* Logo Upload */}
                 <div className="mb-6">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Company Logo
                   </label>
                   <div className="flex items-center space-x-4">
                     {(logoPreview || settings.branding.logoUrl) && (
                       <div className="relative">
                         <img
                           src={logoPreview || settings.branding.logoUrl}
                           alt="Logo preview"
                           className="h-16 w-16 object-contain border border-gray-300 dark:border-gray-600 rounded"
                         />
                         <button
                           onClick={removeLogo}
                           className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                         >
                           <X className="h-3 w-3" />
                         </button>
                       </div>
                     )}
                     <div className="flex-1">
                       <input
                         id="logo-upload"
                         type="file"
                         accept="image/*"
                         onChange={handleLogoUpload}
                         className="hidden"
                       />
                       <label 
                         htmlFor="logo-upload"
                         className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                       >
                         <Upload className="h-4 w-4 mr-2" />
                         {logoPreview || settings.branding.logoUrl ? 'Change Logo' : 'Upload Logo'}
                       </label>
                       <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                         Recommended: 200x200px, PNG or JPG format
                       </p>
                     </div>
                   </div>
                 </div>

                                 {/* Favicon Upload */}
                 <div className="mb-6">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Favicon
                   </label>
                   <div className="flex items-center space-x-4">
                     {(faviconPreview || settings.branding.faviconUrl) && (
                       <div className="relative">
                         <img
                           src={faviconPreview || settings.branding.faviconUrl}
                           alt="Favicon preview"
                           className="h-8 w-8 object-contain border border-gray-300 dark:border-gray-600 rounded"
                         />
                         <button
                           onClick={removeFavicon}
                           className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                         >
                           <X className="h-3 w-3" />
                         </button>
                       </div>
                     )}
                     <div className="flex-1">
                       <input
                         id="favicon-upload"
                         type="file"
                         accept="image/x-icon,image/vnd.microsoft.icon,image/png"
                         onChange={handleFaviconUpload}
                         className="hidden"
                       />
                       <label 
                         htmlFor="favicon-upload"
                         className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                       >
                         <Upload className="h-4 w-4 mr-2" />
                         {faviconPreview || settings.branding.faviconUrl ? 'Change Favicon' : 'Upload Favicon'}
                       </label>
                       <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                         Recommended: 32x32px, ICO or PNG format
                       </p>
                     </div>
                   </div>
                 </div>

                                 {/* Color Scheme */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Primary Color
                     </label>
                     <div className="flex items-center space-x-2">
                       <input
                         type="color"
                         value={localBranding.primaryColor}
                         onChange={(e) => setLocalBranding({ ...localBranding, primaryColor: e.target.value })}
                         className="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded"
                       />
                       <input
                         type="text"
                         value={localBranding.primaryColor}
                         onChange={(e) => setLocalBranding({ ...localBranding, primaryColor: e.target.value })}
                         className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                         placeholder="#3B82F6"
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Secondary Color
                     </label>
                     <div className="flex items-center space-x-2">
                       <input
                         type="color"
                         value={localBranding.secondaryColor}
                         onChange={(e) => setLocalBranding({ ...localBranding, secondaryColor: e.target.value })}
                         className="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded"
                       />
                       <input
                         type="text"
                         value={localBranding.secondaryColor}
                         onChange={(e) => setLocalBranding({ ...localBranding, secondaryColor: e.target.value })}
                         className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                         placeholder="#10B981"
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Button Color
                     </label>
                     <div className="flex items-center space-x-2">
                       <input
                         type="color"
                         value={localBranding.buttonColor}
                         onChange={(e) => setLocalBranding({ ...localBranding, buttonColor: e.target.value })}
                         className="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded"
                       />
                       <input
                         type="text"
                         value={localBranding.buttonColor}
                         onChange={(e) => setLocalBranding({ ...localBranding, buttonColor: e.target.value })}
                         className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                         placeholder="#3B82F6"
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Accent Color
                     </label>
                     <div className="flex items-center space-x-2">
                       <input
                         type="color"
                         value={localBranding.accentColor}
                         onChange={(e) => setLocalBranding({ ...localBranding, accentColor: e.target.value })}
                         className="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded"
                       />
                       <input
                         type="text"
                         value={localBranding.accentColor}
                         onChange={(e) => setLocalBranding({ ...localBranding, accentColor: e.target.value })}
                         className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                         placeholder="#F59E0B"
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Background Color
                     </label>
                     <div className="flex items-center space-x-2">
                       <input
                         type="color"
                         value={localBranding.backgroundColor}
                         onChange={(e) => setLocalBranding({ ...localBranding, backgroundColor: e.target.value })}
                         className="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded"
                       />
                       <input
                         type="text"
                         value={localBranding.backgroundColor}
                         onChange={(e) => setLocalBranding({ ...localBranding, backgroundColor: e.target.value })}
                         className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                         placeholder="#FFFFFF"
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Text Color
                     </label>
                     <div className="flex items-center space-x-2">
                       <input
                         type="color"
                         value={localBranding.textColor}
                         onChange={(e) => setLocalBranding({ ...localBranding, textColor: e.target.value })}
                         className="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded"
                       />
                       <input
                         type="text"
                         value={localBranding.textColor}
                         onChange={(e) => setLocalBranding({ ...localBranding, textColor: e.target.value })}
                         className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                         placeholder="#1F2937"
                       />
                     </div>
                   </div>
                 </div>

                 {/* Typography Settings */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Font Family
                     </label>
                     <select
                       value={localBranding.fontFamily}
                       onChange={(e) => setLocalBranding({ ...localBranding, fontFamily: e.target.value })}
                       className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     >
                       <option value="Inter">Inter</option>
                       <option value="Roboto">Roboto</option>
                       <option value="Open Sans">Open Sans</option>
                       <option value="Lato">Lato</option>
                       <option value="Poppins">Poppins</option>
                       <option value="Montserrat">Montserrat</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Font Size
                     </label>
                     <select
                       value={localBranding.fontSize}
                       onChange={(e) => setLocalBranding({ ...localBranding, fontSize: e.target.value })}
                       className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     >
                       <option value="12px">Small (12px)</option>
                       <option value="14px">Medium (14px)</option>
                       <option value="16px">Large (16px)</option>
                       <option value="18px">Extra Large (18px)</option>
                       <option value="20px">XXL (20px)</option>
                       <option value="22px">XXXL (22px)</option>
                       <option value="24px">Huge (24px)</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Border Radius
                     </label>
                     <select
                       value={localBranding.borderRadius}
                       onChange={(e) => setLocalBranding({ ...localBranding, borderRadius: e.target.value })}
                       className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     >
                       <option value="0">None</option>
                       <option value="0.125rem">Small (2px)</option>
                       <option value="0.25rem">Medium (4px)</option>
                       <option value="0.375rem">Large (6px)</option>
                       <option value="0.5rem">Extra Large (8px)</option>
                       <option value="1rem">Rounded (16px)</option>
                                          </select>
                   </div>
                 </div>

                 {/* Error Display */}
                 {error && (
                   <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                     <p className="text-red-800 text-sm">{error}</p>
                   </div>
                 )}

                 {/* Save Button */}
                 <div className="mt-6 flex justify-end">
                   <button
                     onClick={handleSave}
                     disabled={isLoading}
                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isLoading ? (
                       <>
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                         Saving...
                       </>
                     ) : (
                       <>
                         <Save className="h-4 w-4 mr-2" />
                         Save Changes
                       </>
                     )}
                   </button>
                 </div>
               </div>

               {/* Display Settings */}
               <div className="mt-8">
                 <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Display Preferences</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Theme
                     </label>
                     <select
                       value={settings.display.theme}
                       onChange={(e) => {
                         const newTheme = e.target.value as 'light' | 'dark' | 'auto';
                         updateSettings('display', { theme: newTheme });
                         setTheme(newTheme);
                       }}
                       className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     >
                       <option value="light">Light</option>
                       <option value="dark">Dark</option>
                       <option value="auto">Auto (System)</option>
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Language
                     </label>
                     <select
                       value={settings.display.language}
                       onChange={(e) => updateSettings('display', { language: e.target.value })}
                       className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     >
                       <option value="en">English</option>
                       <option value="es">Spanish</option>
                       <option value="fr">French</option>
                       <option value="de">German</option>
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Timezone
                     </label>
                     <select
                       value={settings.display.timezone}
                       onChange={(e) => updateSettings('display', { timezone: e.target.value })}
                       className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     >
                       <option value="UTC">UTC (Coordinated Universal Time)</option>
                       
                       {/* Asia Pacific */}
                       <optgroup label="Asia Pacific">
                         <option value="Asia/Manila">Philippines (PHT)</option>
                         <option value="Asia/Shanghai">China (CST)</option>
                         <option value="Asia/Tokyo">Japan (JST)</option>
                         <option value="Asia/Seoul">South Korea (KST)</option>
                         <option value="Asia/Singapore">Singapore (SGT)</option>
                         <option value="Asia/Bangkok">Thailand (ICT)</option>
                         <option value="Asia/Ho_Chi_Minh">Vietnam (ICT)</option>
                         <option value="Asia/Jakarta">Indonesia (WIB)</option>
                         <option value="Asia/Kuala_Lumpur">Malaysia (MYT)</option>
                         <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                         <option value="Asia/Taipei">Taiwan (CST)</option>
                         <option value="Asia/Kolkata">India (IST)</option>
                         <option value="Asia/Dhaka">Bangladesh (BST)</option>
                         <option value="Asia/Karachi">Pakistan (PKT)</option>
                         <option value="Asia/Dubai">UAE (GST)</option>
                         <option value="Asia/Riyadh">Saudi Arabia (AST)</option>
                         <option value="Asia/Tehran">Iran (IRST)</option>
                         <option value="Asia/Jerusalem">Israel (IST)</option>
                       </optgroup>

                       {/* Europe */}
                       <optgroup label="Europe">
                         <option value="Europe/London">United Kingdom (GMT/BST)</option>
                         <option value="Europe/Paris">France (CET/CEST)</option>
                         <option value="Europe/Berlin">Germany (CET/CEST)</option>
                         <option value="Europe/Rome">Italy (CET/CEST)</option>
                         <option value="Europe/Madrid">Spain (CET/CEST)</option>
                         <option value="Europe/Amsterdam">Netherlands (CET/CEST)</option>
                         <option value="Europe/Brussels">Belgium (CET/CEST)</option>
                         <option value="Europe/Vienna">Austria (CET/CEST)</option>
                         <option value="Europe/Zurich">Switzerland (CET/CEST)</option>
                         <option value="Europe/Stockholm">Sweden (CET/CEST)</option>
                         <option value="Europe/Oslo">Norway (CET/CEST)</option>
                         <option value="Europe/Copenhagen">Denmark (CET/CEST)</option>
                         <option value="Europe/Helsinki">Finland (EET/EEST)</option>
                         <option value="Europe/Warsaw">Poland (CET/CEST)</option>
                         <option value="Europe/Prague">Czech Republic (CET/CEST)</option>
                         <option value="Europe/Budapest">Hungary (CET/CEST)</option>
                         <option value="Europe/Bucharest">Romania (EET/EEST)</option>
                         <option value="Europe/Sofia">Bulgaria (EET/EEST)</option>
                         <option value="Europe/Athens">Greece (EET/EEST)</option>
                         <option value="Europe/Istanbul">Turkey (TRT)</option>
                         <option value="Europe/Moscow">Russia (MSK)</option>
                       </optgroup>

                       {/* Americas */}
                       <optgroup label="Americas">
                         <option value="America/New_York">Eastern Time (ET)</option>
                         <option value="America/Chicago">Central Time (CT)</option>
                         <option value="America/Denver">Mountain Time (MT)</option>
                         <option value="America/Los_Angeles">Pacific Time (PT)</option>
                         <option value="America/Anchorage">Alaska Time (AKT)</option>
                         <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                         <option value="America/Toronto">Canada Eastern (ET)</option>
                         <option value="America/Vancouver">Canada Pacific (PT)</option>
                         <option value="America/Mexico_City">Mexico (CST)</option>
                         <option value="America/Sao_Paulo">Brazil (BRT)</option>
                         <option value="America/Argentina/Buenos_Aires">Argentina (ART)</option>
                         <option value="America/Santiago">Chile (CLT)</option>
                         <option value="America/Lima">Peru (PET)</option>
                         <option value="America/Bogota">Colombia (COT)</option>
                         <option value="America/Caracas">Venezuela (VET)</option>
                       </optgroup>

                       {/* Africa */}
                       <optgroup label="Africa">
                         <option value="Africa/Cairo">Egypt (EET)</option>
                         <option value="Africa/Johannesburg">South Africa (SAST)</option>
                         <option value="Africa/Lagos">Nigeria (WAT)</option>
                         <option value="Africa/Casablanca">Morocco (WET)</option>
                         <option value="Africa/Nairobi">Kenya (EAT)</option>
                         <option value="Africa/Addis_Ababa">Ethiopia (EAT)</option>
                         <option value="Africa/Dar_es_Salaam">Tanzania (EAT)</option>
                         <option value="Africa/Khartoum">Sudan (EAT)</option>
                         <option value="Africa/Algiers">Algeria (CET)</option>
                         <option value="Africa/Tunis">Tunisia (CET)</option>
                       </optgroup>

                       {/* Oceania */}
                       <optgroup label="Oceania">
                         <option value="Australia/Sydney">Australia Eastern (AEST/AEDT)</option>
                         <option value="Australia/Melbourne">Australia Eastern (AEST/AEDT)</option>
                         <option value="Australia/Perth">Australia Western (AWST)</option>
                         <option value="Australia/Adelaide">Australia Central (ACST/ACDT)</option>
                         <option value="Australia/Darwin">Australia Central (ACST)</option>
                         <option value="Pacific/Auckland">New Zealand (NZST/NZDT)</option>
                         <option value="Pacific/Fiji">Fiji (FJT)</option>
                         <option value="Pacific/Guam">Guam (ChST)</option>
                         <option value="Pacific/Saipan">Northern Mariana Islands (ChST)</option>
                       </optgroup>
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Date Format
                     </label>
                     <select
                       value={settings.display.dateFormat}
                       onChange={(e) => updateSettings('display', { dateFormat: e.target.value })}
                       className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     >
                       <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                       <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                       <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Time Format
                     </label>
                     <select
                       value={settings.display.timeFormat}
                       onChange={(e) => updateSettings('display', { timeFormat: e.target.value })}
                       className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     >
                       <option value="12h">12-hour (AM/PM)</option>
                       <option value="24h">24-hour</option>
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Number Format
                     </label>
                     <select
                       value={settings.display.numberFormat}
                       onChange={(e) => updateSettings('display', { numberFormat: e.target.value })}
                       className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     >
                       <option value="1,234.56">1,234.56 (US)</option>
                       <option value="1.234,56">1.234,56 (EU)</option>
                       <option value="1234.56">1234.56 (No separators)</option>
                     </select>
                   </div>
                 </div>

                 <div className="mt-6 space-y-4">
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.display.compactMode}
                       onChange={(e) => updateSettings('display', { compactMode: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Compact mode (reduced spacing)</span>
                   </label>

                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.display.showAnimations}
                       onChange={(e) => updateSettings('display', { showAnimations: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show animations and transitions</span>
                   </label>

                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.display.sidebarCollapsed}
                       onChange={(e) => updateSettings('display', { sidebarCollapsed: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Start with collapsed sidebar</span>
                   </label>
                 </div>
               </div>
             </div>
           )}

          {/* Footer Settings */}
          {activeTab === 'footer' && (
            <div className="space-y-6">
              <div>
                                 <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Footer Configuration</h3>

                                 {/* Enable Footer */}
                 <div className="mb-6">
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.footer.enabled}
                       onChange={(e) => updateSettings('footer', { enabled: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable footer on all pages</span>
                   </label>
                 </div>

                 {/* Footer Text */}
                 <div className="mb-6">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Footer Text
                   </label>
                   <textarea
                     value={localFooterText}
                     onChange={(e) => setLocalFooterText(e.target.value)}
                     rows={3}
                     className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     placeholder="Enter footer text"
                   />
                 </div>

                 {/* Footer Links */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Footer Links
                   </label>
                   <div className="space-y-3">
                     {localFooterLinks.map((link, index) => (
                       <div key={index} className="flex space-x-2">
                         <input
                           type="text"
                           value={link.label}
                           onChange={(e) => {
                             const newLinks = [...localFooterLinks];
                             newLinks[index].label = e.target.value;
                             setLocalFooterLinks(newLinks);
                           }}
                           className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                           placeholder="Link label"
                         />
                         <input
                           type="text"
                           value={link.url}
                           onChange={(e) => {
                             const newLinks = [...localFooterLinks];
                             newLinks[index].url = e.target.value;
                             setLocalFooterLinks(newLinks);
                           }}
                           className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                           placeholder="URL"
                         />
                         <button
                           onClick={() => {
                             const newLinks = localFooterLinks.filter((_, i) => i !== index);
                             setLocalFooterLinks(newLinks);
                           }}
                           className="px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                         >
                           <X className="h-4 w-4" />
                         </button>
                       </div>
                     ))}
                     <button
                       onClick={() => {
                         const newLinks = [...localFooterLinks, { label: '', url: '' }];
                         setLocalFooterLinks(newLinks);
                       }}
                       className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                     >
                       + Add Link
                     </button>
                   </div>
                 </div>

                 {/* Save Button and Status */}
                 <div className="mt-6 flex items-center space-x-4">
                   <button
                     onClick={handleSave}
                     disabled={saveStatus === 'saving'}
                     className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {saveStatus === 'saving' ? (
                       <>
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                         Saving...
                       </>
                     ) : (
                       <>
                         <Save className="h-4 w-4 mr-2" />
                         Save Changes
                       </>
                     )}
                   </button>
                   
                   {saveStatus === 'success' && (
                     <div className="text-green-600 dark:text-green-400 text-sm">
                       ✓ Settings saved successfully!
                     </div>
                   )}
                   
                   {saveStatus === 'error' && (
                     <div className="text-red-600 dark:text-red-400 text-sm">
                       ✗ Failed to save settings. Please try again.
                     </div>
                   )}
                 </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                                 <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Preferences</h3>

                                 <div className="space-y-4">
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.notifications.emailNotifications}
                       onChange={(e) => updateSettings('notifications', { emailNotifications: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable email notifications</span>
                   </label>

                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.notifications.timesheetReminders}
                       onChange={(e) => updateSettings('notifications', { timesheetReminders: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Send timesheet reminders</span>
                   </label>

                                      <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.notifications.weeklyReports}
                       onChange={(e) => updateSettings('notifications', { weeklyReports: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Send weekly reports</span>
                   </label>
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.notifications.dailyDigest}
                       onChange={(e) => updateSettings('notifications', { dailyDigest: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Daily digest email</span>
                   </label>
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.notifications.projectUpdates}
                       onChange={(e) => updateSettings('notifications', { projectUpdates: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Project updates and changes</span>
                   </label>
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.notifications.clientNotifications}
                       onChange={(e) => updateSettings('notifications', { clientNotifications: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Client-related notifications</span>
                   </label>
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.notifications.pushNotifications}
                       onChange={(e) => updateSettings('notifications', { pushNotifications: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Browser push notifications</span>
                   </label>
                 </div>

                 {/* Reminder Settings */}
                 <div className="space-y-4">
                   <h4 className="text-md font-medium text-gray-900 dark:text-white">Reminder Settings</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Reminder Time
                       </label>
                       <input
                         type="time"
                         value={settings.notifications.reminderTime}
                         onChange={(e) => updateSettings('notifications', { reminderTime: e.target.value })}
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Email Template
                       </label>
                       <select
                         value={settings.notifications.emailTemplate}
                         onChange={(e) => updateSettings('notifications', { emailTemplate: e.target.value })}
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       >
                         <option value="default">Default Template</option>
                         <option value="minimal">Minimal Template</option>
                         <option value="detailed">Detailed Template</option>
                         <option value="custom">Custom Template</option>
                       </select>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                                 <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Configuration</h3>

                                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Session Timeout (minutes)
                     </label>
                     <input
                       type="number"
                       value={settings.security.sessionTimeout}
                       onChange={(e) => updateSettings('security', { sessionTimeout: parseInt(e.target.value) })}
                       min="5"
                       max="480"
                       className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                     />
                   </div>

                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.security.requirePasswordChange}
                       onChange={(e) => updateSettings('security', { requirePasswordChange: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Require password change every 90 days</span>
                   </label>

                                      <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.security.twoFactorAuth}
                       onChange={(e) => updateSettings('security', { twoFactorAuth: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable two-factor authentication</span>
                   </label>
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.security.auditLogging}
                       onChange={(e) => updateSettings('security', { auditLogging: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable audit logging</span>
                   </label>
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={settings.security.dataEncryption}
                       onChange={(e) => updateSettings('security', { dataEncryption: e.target.checked })}
                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable data encryption</span>
                   </label>
                 </div>

                 {/* Password Policy */}
                 <div className="space-y-4">
                   <h4 className="text-md font-medium text-gray-900 dark:text-white">Password Policy</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Minimum Password Length
                       </label>
                       <input
                         type="number"
                         value={settings.security.passwordMinLength}
                         onChange={(e) => updateSettings('security', { passwordMinLength: parseInt(e.target.value) })}
                         min="6"
                         max="32"
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Password Complexity
                       </label>
                       <select
                         value={settings.security.passwordComplexity}
                         onChange={(e) => updateSettings('security', { passwordComplexity: e.target.value })}
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       >
                         <option value="low">Low (letters only)</option>
                         <option value="medium">Medium (letters + numbers)</option>
                         <option value="high">High (letters + numbers + symbols)</option>
                       </select>
                     </div>
                   </div>
                 </div>

                 {/* Login Security */}
                 <div className="space-y-4">
                   <h4 className="text-md font-medium text-gray-900 dark:text-white">Login Security</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Max Login Attempts
                       </label>
                       <input
                         type="number"
                         value={settings.security.loginAttempts}
                         onChange={(e) => updateSettings('security', { loginAttempts: parseInt(e.target.value) })}
                         min="3"
                         max="10"
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Lockout Duration (minutes)
                       </label>
                       <input
                         type="number"
                         value={settings.security.lockoutDuration}
                         onChange={(e) => updateSettings('security', { lockoutDuration: parseInt(e.target.value) })}
                         min="5"
                         max="60"
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       />
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* System Settings */}
           {activeTab === 'system' && (
             <div className="space-y-6">
               {systemTabError && (
                 <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                   <div className="flex">
                     <div className="flex-shrink-0">
                       <Shield className="h-5 w-5 text-red-400" />
                     </div>
                     <div className="ml-3">
                       <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading System Settings</h3>
                       <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                         {systemTabError}
                       </div>
                     </div>
                   </div>
                 </div>
               )}
               
               <div>
                 <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Configuration</h3>

                 {/* Backup Settings */}
                 <div className="space-y-4">
                   <h4 className="text-md font-medium text-gray-900 dark:text-white">Backup & Data</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={settings.system?.autoBackup ?? true}
                         onChange={(e) => updateSettings('system', { autoBackup: e.target.checked })}
                         className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                       />
                       <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable automatic backups</span>
                     </label>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Backup Frequency
                       </label>
                       <select
                         value={settings.system?.backupFrequency ?? 'daily'}
                         onChange={(e) => updateSettings('system', { backupFrequency: e.target.value })}
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       >
                         <option value="daily">Daily</option>
                         <option value="weekly">Weekly</option>
                         <option value="monthly">Monthly</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Retention Period (days)
                       </label>
                       <input
                         type="number"
                         value={settings.system?.retentionPeriod ?? 30}
                         onChange={(e) => updateSettings('system', { retentionPeriod: parseInt(e.target.value) })}
                         min="7"
                         max="365"
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Data Retention (days)
                       </label>
                       <input
                         type="number"
                         value={settings.system?.dataRetention ?? 365}
                         onChange={(e) => updateSettings('system', { dataRetention: parseInt(e.target.value) })}
                         min="30"
                         max="1095"
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       />
                     </div>
                   </div>
                 </div>

                 {/* System Options */}
                 <div className="space-y-4">
                   <h4 className="text-md font-medium text-gray-900 dark:text-white">System Options</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={settings.system?.maintenanceMode ?? false}
                         onChange={(e) => updateSettings('system', { maintenanceMode: e.target.checked })}
                         className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                       />
                       <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Maintenance mode</span>
                     </label>
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={settings.system?.debugMode ?? false}
                         onChange={(e) => updateSettings('system', { debugMode: e.target.checked })}
                         className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                       />
                       <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Debug mode</span>
                     </label>
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={settings.system?.performanceMode ?? false}
                         onChange={(e) => updateSettings('system', { performanceMode: e.target.checked })}
                         className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                       />
                       <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Performance mode</span>
                     </label>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Log Level
                       </label>
                       <select
                         value={settings.system?.logLevel ?? 'info'}
                         onChange={(e) => updateSettings('system', { logLevel: e.target.value })}
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       >
                         <option value="error">Error</option>
                         <option value="warn">Warning</option>
                         <option value="info">Info</option>
                         <option value="debug">Debug</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Max File Size (MB)
                       </label>
                       <input
                         type="number"
                         value={settings.system?.maxFileSize ?? 10}
                         onChange={(e) => updateSettings('system', { maxFileSize: parseInt(e.target.value) })}
                         min="1"
                         max="100"
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       />
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* User Preferences Tab */}
           {activeTab === 'preferences' && (
             <div className="space-y-6">
               <div>
                 <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Preferences</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                   These preferences are synced across all your devices and are specific to your account.
                 </p>

                 {/* Display Preferences */}
                 <div className="space-y-4">
                   <h4 className="text-md font-medium text-gray-900 dark:text-white">Display Preferences</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Theme
                       </label>
                       <select
                         value={preferences?.theme || 'light'}
                         onChange={(e) => updatePreferences({ theme: e.target.value as 'light' | 'dark' | 'auto' })}
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       >
                         <option value="light">Light</option>
                         <option value="dark">Dark</option>
                         <option value="auto">Auto (System)</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Language
                       </label>
                       <select
                         value={preferences?.language || 'en'}
                         onChange={(e) => updatePreferences({ language: e.target.value })}
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       >
                         <option value="en">English</option>
                         <option value="es">Spanish</option>
                         <option value="fr">French</option>
                         <option value="de">German</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Timezone
                       </label>
                       <select
                         value={preferences?.timezone || 'UTC'}
                         onChange={(e) => updatePreferences({ timezone: e.target.value })}
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       >
                         <option value="UTC">UTC (Coordinated Universal Time)</option>
                         
                         {/* Asia Pacific */}
                         <optgroup label="Asia Pacific">
                           <option value="Asia/Manila">Philippines (PHT)</option>
                           <option value="Asia/Shanghai">China (CST)</option>
                           <option value="Asia/Tokyo">Japan (JST)</option>
                           <option value="Asia/Seoul">South Korea (KST)</option>
                           <option value="Asia/Singapore">Singapore (SGT)</option>
                           <option value="Asia/Bangkok">Thailand (ICT)</option>
                           <option value="Asia/Ho_Chi_Minh">Vietnam (ICT)</option>
                           <option value="Asia/Jakarta">Indonesia (WIB)</option>
                           <option value="Asia/Kuala_Lumpur">Malaysia (MYT)</option>
                           <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                           <option value="Asia/Taipei">Taiwan (CST)</option>
                           <option value="Asia/Kolkata">India (IST)</option>
                           <option value="Asia/Dhaka">Bangladesh (BST)</option>
                           <option value="Asia/Karachi">Pakistan (PKT)</option>
                           <option value="Asia/Dubai">UAE (GST)</option>
                           <option value="Asia/Riyadh">Saudi Arabia (AST)</option>
                           <option value="Asia/Tehran">Iran (IRST)</option>
                           <option value="Asia/Jerusalem">Israel (IST)</option>
                         </optgroup>

                         {/* Europe */}
                         <optgroup label="Europe">
                           <option value="Europe/London">United Kingdom (GMT/BST)</option>
                           <option value="Europe/Paris">France (CET/CEST)</option>
                           <option value="Europe/Berlin">Germany (CET/CEST)</option>
                           <option value="Europe/Rome">Italy (CET/CEST)</option>
                           <option value="Europe/Madrid">Spain (CET/CEST)</option>
                           <option value="Europe/Amsterdam">Netherlands (CET/CEST)</option>
                           <option value="Europe/Brussels">Belgium (CET/CEST)</option>
                           <option value="Europe/Vienna">Austria (CET/CEST)</option>
                           <option value="Europe/Zurich">Switzerland (CET/CEST)</option>
                           <option value="Europe/Stockholm">Sweden (CET/CEST)</option>
                           <option value="Europe/Oslo">Norway (CET/CEST)</option>
                           <option value="Europe/Copenhagen">Denmark (CET/CEST)</option>
                           <option value="Europe/Helsinki">Finland (EET/EEST)</option>
                           <option value="Europe/Warsaw">Poland (CET/CEST)</option>
                           <option value="Europe/Prague">Czech Republic (CET/CEST)</option>
                           <option value="Europe/Budapest">Hungary (CET/CEST)</option>
                           <option value="Europe/Bucharest">Romania (EET/EEST)</option>
                           <option value="Europe/Sofia">Bulgaria (EET/EEST)</option>
                           <option value="Europe/Athens">Greece (EET/EEST)</option>
                           <option value="Europe/Istanbul">Turkey (TRT)</option>
                           <option value="Europe/Moscow">Russia (MSK)</option>
                         </optgroup>

                         {/* Americas */}
                         <optgroup label="Americas">
                           <option value="America/New_York">Eastern Time (ET)</option>
                           <option value="America/Chicago">Central Time (CT)</option>
                           <option value="America/Denver">Mountain Time (MT)</option>
                           <option value="America/Los_Angeles">Pacific Time (PT)</option>
                           <option value="America/Anchorage">Alaska Time (AKT)</option>
                           <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                           <option value="America/Toronto">Canada Eastern (ET)</option>
                           <option value="America/Vancouver">Canada Pacific (PT)</option>
                           <option value="America/Mexico_City">Mexico (CST)</option>
                           <option value="America/Sao_Paulo">Brazil (BRT)</option>
                           <option value="America/Argentina/Buenos_Aires">Argentina (ART)</option>
                           <option value="America/Santiago">Chile (CLT)</option>
                           <option value="America/Lima">Peru (PET)</option>
                           <option value="America/Bogota">Colombia (COT)</option>
                           <option value="America/Caracas">Venezuela (VET)</option>
                         </optgroup>

                         {/* Africa */}
                         <optgroup label="Africa">
                           <option value="Africa/Cairo">Egypt (EET)</option>
                           <option value="Africa/Johannesburg">South Africa (SAST)</option>
                           <option value="Africa/Lagos">Nigeria (WAT)</option>
                           <option value="Africa/Casablanca">Morocco (WET)</option>
                           <option value="Africa/Nairobi">Kenya (EAT)</option>
                           <option value="Africa/Addis_Ababa">Ethiopia (EAT)</option>
                           <option value="Africa/Dar_es_Salaam">Tanzania (EAT)</option>
                           <option value="Africa/Khartoum">Sudan (EAT)</option>
                           <option value="Africa/Algiers">Algeria (CET)</option>
                           <option value="Africa/Tunis">Tunisia (CET)</option>
                         </optgroup>

                         {/* Oceania */}
                         <optgroup label="Oceania">
                           <option value="Australia/Sydney">Australia Eastern (AEST/AEDT)</option>
                           <option value="Australia/Melbourne">Australia Eastern (AEST/AEDT)</option>
                           <option value="Australia/Perth">Australia Western (AWST)</option>
                           <option value="Australia/Adelaide">Australia Central (ACST/ACDT)</option>
                           <option value="Australia/Darwin">Australia Central (ACST)</option>
                           <option value="Pacific/Auckland">New Zealand (NZST/NZDT)</option>
                           <option value="Pacific/Fiji">Fiji (FJT)</option>
                           <option value="Pacific/Guam">Guam (ChST)</option>
                           <option value="Pacific/Saipan">Northern Mariana Islands (ChST)</option>
                         </optgroup>
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Currency
                       </label>
                       <select
                         value={preferences?.currency || 'USD'}
                         onChange={(e) => updatePreferences({ currency: e.target.value })}
                         className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                       >
                         <option value="USD">USD ($)</option>
                         <option value="EUR">EUR (€)</option>
                         <option value="GBP">GBP (£)</option>
                         <option value="CAD">CAD (C$)</option>
                       </select>
                     </div>
                   </div>
                 </div>

                 {/* Notification Preferences */}
                 <div className="space-y-4">
                   <h4 className="text-md font-medium text-gray-900 dark:text-white">Notification Preferences</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={preferences?.emailNotifications || false}
                         onChange={(e) => updatePreferences({ emailNotifications: e.target.checked })}
                         className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                       />
                       <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Email notifications</span>
                     </label>
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={preferences?.pushNotifications || false}
                         onChange={(e) => updatePreferences({ pushNotifications: e.target.checked })}
                         className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                       />
                       <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Push notifications</span>
                     </label>
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={preferences?.timesheetReminders || false}
                         onChange={(e) => updatePreferences({ timesheetReminders: e.target.checked })}
                         className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                       />
                       <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Timesheet reminders</span>
                     </label>
                     <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={preferences?.weeklyReports || false}
                         onChange={(e) => updatePreferences({ weeklyReports: e.target.checked })}
                         className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                       />
                       <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Weekly reports</span>
                     </label>
                   </div>
                 </div>

                 {/* Sync Actions */}
                 <div className="space-y-4">
                   <h4 className="text-md font-medium text-gray-900 dark:text-white">Sync & Actions</h4>
                   <div className="flex space-x-4">
                     <button
                       onClick={syncPreferences}
                       className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                     >
                       Sync Across Devices
                     </button>
                     <button
                       onClick={resetPreferences}
                       className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                     >
                       Reset to Default
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* Email Configuration Tab */}
           {activeTab === 'email' && (
             <div className="space-y-6">
               <div>
                 <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Email Configuration</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                   Configure your application's email settings, including SMTP, sender information, and default email templates.
                 </p>
                 <EmailConfiguration />
               </div>
             </div>
           )}

           {/* Currencies Tab */}
           {activeTab === 'currencies' && (
             <div className="space-y-6">
               <div>
                 <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Currency Management</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                   Create and manage custom currencies for your timesheet system. You can set exchange rates relative to USD and choose default currencies.
                 </p>

                 <CustomCurrencyManager />
               </div>
             </div>
           )}

        </div>
      </div>

      {/* Global Save Button and Status */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {saveStatus === 'success' && (
              <div className="text-green-600 dark:text-green-400 text-sm flex items-center">
                <span className="mr-2">✓</span>
                Settings saved successfully!
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div className="text-red-600 dark:text-red-400 text-sm flex items-center">
                <span className="mr-2">✗</span>
                Failed to save settings. Please try again.
              </div>
            )}
          </div>
          
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
