import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  enabled?: boolean;
  text?: string;
  links?: Array<{ label: string; url: string }>;
}

const Footer: React.FC<FooterProps> = ({ 
  enabled = true, 
  text = '© 2024 Timesheet Management System. All rights reserved.',
  links = [
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Terms of Service', url: '/terms' },
    { label: 'Support', url: '/support' },
  ]
}) => {
  if (!enabled) return null;

  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Footer Text */}
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
            {text}
          </div>
          
          {/* Footer Links */}
          {links.length > 0 && (
            <div className="flex flex-wrap justify-center md:justify-end space-x-6">
              {links.map((link, index) => (
                <Link
                  key={index}
                  to={link.url}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
