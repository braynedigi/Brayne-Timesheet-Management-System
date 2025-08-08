import React, { useState } from 'react';
import { X, Keyboard, Plus, Search, Save, ArrowUp, ArrowDown } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { key: 'Alt + 1', description: 'Go to Dashboard' },
        { key: 'Alt + 2', description: 'Go to Timesheets' },
        { key: 'Alt + 3', description: 'Go to Projects' },
        { key: 'Alt + 4', description: 'Go to Clients' },
        { key: 'Alt + 5', description: 'Go to Users' },
        { key: 'Alt + 6', description: 'Go to Reports' },
        { key: 'Alt + 7', description: 'Go to Settings' },
      ]
    },
    {
      category: 'Actions',
      items: [
        { key: 'Ctrl/Cmd + N', description: 'Add new timesheet' },
        { key: 'Ctrl/Cmd + K', description: 'Search' },
        { key: 'Ctrl/Cmd + S', description: 'Save' },
        { key: 'Escape', description: 'Close modal/form' },
      ]
    },
    {
      category: 'General',
      items: [
        { key: 'Tab', description: 'Navigate between fields' },
        { key: 'Enter', description: 'Submit form' },
        { key: 'Space', description: 'Toggle checkboxes' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Keyboard className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Keyboard Shortcuts</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Shortcuts List */}
          <div className="space-y-6">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-1">
                  {category.category}
                </h4>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div key={item.key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.description}</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Tip: Shortcuts don't work when typing in input fields
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
