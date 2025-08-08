import { useEffect, useRef } from 'react';

interface UseAutoSaveOptions {
  key: string;
  data: any;
  enabled?: boolean;
  debounceMs?: number;
  onRestore?: (data: any) => void;
}

export const useAutoSave = ({
  key,
  data,
  enabled = true,
  debounceMs = 1000,
  onRestore
}: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isInitialized = useRef(false);

  // Auto-save data to localStorage
  useEffect(() => {
    if (!enabled || !data) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`autosave_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to auto-save form data:', error);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, data, enabled, debounceMs]);

  // Restore data from localStorage on mount
  useEffect(() => {
    if (!enabled || isInitialized.current) return;

    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000; // 24 hours

        if (!isExpired && onRestore) {
          onRestore(parsed.data);
        } else if (isExpired) {
          // Clean up expired data
          localStorage.removeItem(`autosave_${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to restore auto-saved data:', error);
    }

    isInitialized.current = true;
  }, [key, enabled, onRestore]);

  // Clear auto-saved data
  const clearAutoSave = () => {
    try {
      localStorage.removeItem(`autosave_${key}`);
    } catch (error) {
      console.warn('Failed to clear auto-saved data:', error);
    }
  };

  return { clearAutoSave };
};
