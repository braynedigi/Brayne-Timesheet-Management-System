import React, { useState, useEffect } from 'react';
import { Mail, TestTube, Send, Settings, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  fromName: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  variables: string[];
}

const EmailConfiguration: React.FC = () => {
  const [config, setConfig] = useState<EmailConfig>({
    host: '',
    port: 587,
    secure: false,
    auth: {
      user: '',
      pass: '',
    },
    from: '',
    fromName: '',
  });
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [status, setStatus] = useState<{ configured: boolean; connected: boolean }>({ configured: false, connected: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState({ to: '', subject: 'Test Email', message: 'This is a test email from the timesheet system.' });
  const [selectedTemplate, setSelectedTemplate] = useState('default');

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchStatus();
    fetchTemplates();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/email/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching email status:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/email/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleConfigChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof EmailConfig],
          [child]: value,
        },
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleConfigure = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/email/configure`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Email configuration updated successfully');
        await fetchStatus();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to configure email');
      }
    } catch (error) {
      toast.error('Failed to configure email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/email/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Email connection test successful');
        await fetchStatus();
      } else {
        toast.error('Email connection test failed');
      }
    } catch (error) {
      toast.error('Failed to test email connection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.to) {
      toast.error('Please enter a recipient email address');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/email/send-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testEmail,
          template: selectedTemplate,
        }),
      });

      if (response.ok) {
        toast.success('Test email sent successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send test email');
      }
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMTP Host
            </label>
            <input
              type="text"
              value={config.host}
              onChange={(e) => handleConfigChange('host', e.target.value)}
              placeholder="smtp.gmail.com"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Port
            </label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
              placeholder="587"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={config.auth.user}
              onChange={(e) => handleConfigChange('auth.user', e.target.value)}
              placeholder="your-email@gmail.com"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password/App Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={config.auth.pass}
                onChange={(e) => handleConfigChange('auth.pass', e.target.value)}
                placeholder="Enter your password"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Email
            </label>
            <input
              type="email"
              value={config.from}
              onChange={(e) => handleConfigChange('from', e.target.value)}
              placeholder="noreply@yourcompany.com"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Name
            </label>
            <input
              type="text"
              value={config.fromName}
              onChange={(e) => handleConfigChange('fromName', e.target.value)}
              placeholder="Your Company Name"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            checked={config.secure}
            onChange={(e) => handleConfigChange('secure', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm text-gray-700 dark:text-gray-300">
            Use SSL/TLS (usually for port 465)
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleConfigure}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Settings className="h-4 w-4" />
            {isLoading ? 'Configuring...' : 'Configure Email'}
          </button>

          <button
            onClick={handleTestConnection}
            disabled={isLoading || !status.configured}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <TestTube className="h-4 w-4" />
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status.configured ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {status.configured ? 'Configured' : 'Not Configured'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {status.connected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Email */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Send Test Email</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient Email
            </label>
            <input
              type="email"
              value={testEmail.to}
              onChange={(e) => setTestEmail(prev => ({ ...prev, to: e.target.value }))}
              placeholder="test@example.com"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={testEmail.subject}
              onChange={(e) => setTestEmail(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={testEmail.message}
              onChange={(e) => setTestEmail(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={handleSendTestEmail}
          disabled={isLoading || !status.configured || !testEmail.to}
          className="mt-4 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          <Mail className="h-4 w-4" />
          {isLoading ? 'Sending...' : 'Send Test Email'}
        </button>
      </div>

      {/* Email Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email Templates</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div key={template.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">{template.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.subject}</p>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                <strong>Variables:</strong> {template.variables.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmailConfiguration;
