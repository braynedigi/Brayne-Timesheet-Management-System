import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcutsProps {
  onAddTimesheet?: () => void;
  onSearch?: () => void;
  onSave?: () => void;
  onEscape?: () => void;
}

export const useKeyboardShortcuts = ({
  onAddTimesheet,
  onSearch,
  onSave,
  onEscape
}: KeyboardShortcutsProps = {}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Ctrl/Cmd + N: Add new timesheet
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        onAddTimesheet?.();
      }

      // Ctrl/Cmd + K: Search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        onSearch?.();
      }

      // Ctrl/Cmd + S: Save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        onSave?.();
      }

      // Escape: Close modals/forms
      if (event.key === 'Escape') {
        onEscape?.();
      }

      // Navigation shortcuts
      if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            navigate('/dashboard');
            break;
          case '2':
            event.preventDefault();
            navigate('/timesheets');
            break;
          case '3':
            event.preventDefault();
            navigate('/projects');
            break;
          case '4':
            event.preventDefault();
            navigate('/clients');
            break;
          case '5':
            event.preventDefault();
            navigate('/users');
            break;
          case '6':
            event.preventDefault();
            navigate('/reports');
            break;
          case '7':
            event.preventDefault();
            navigate('/settings');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, onAddTimesheet, onSearch, onSave, onEscape]);
};
