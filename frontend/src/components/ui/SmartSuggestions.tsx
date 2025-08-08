import React, { useState, useEffect } from 'react';
import { Clock, Zap, History } from 'lucide-react';
import { getSuggestedTime, getTimeSuggestions, formatHours } from '@/utils/timeUtils';

interface TaskSuggestion {
  taskName: string;
  hours: number;
  frequency: number;
}

interface SmartSuggestionsProps {
  taskName: string;
  onTaskSelect: (taskName: string, hours: number) => void;
  previousEntries: Array<{ taskName: string; hours: number }>;
  visible: boolean;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  taskName,
  onTaskSelect,
  previousEntries,
  visible
}) => {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [timeSuggestions] = useState(() => getTimeSuggestions());

  useEffect(() => {
    if (!taskName.trim() || !visible) {
      setSuggestions([]);
      return;
    }

    // Generate task suggestions based on previous entries
    const taskFrequency: Record<string, { hours: number; count: number }> = {};
    
    previousEntries.forEach(entry => {
      if (entry.taskName.toLowerCase().includes(taskName.toLowerCase())) {
        if (!taskFrequency[entry.taskName]) {
          taskFrequency[entry.taskName] = { hours: 0, count: 0 };
        }
        taskFrequency[entry.taskName].hours += entry.hours;
        taskFrequency[entry.taskName].count += 1;
      }
    });

    const taskSuggestions: TaskSuggestion[] = Object.entries(taskFrequency)
      .map(([taskName, { hours, count }]) => ({
        taskName,
        hours: hours / count, // Average hours
        frequency: count
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    setSuggestions(taskSuggestions);
  }, [taskName, previousEntries, visible]);

  if (!visible || (!suggestions.length && !timeSuggestions.length)) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
      {/* Task Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-2">
          <div className="flex items-center text-xs font-medium text-gray-500 mb-2">
            <History className="h-3 w-3 mr-1" />
            Based on your history
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onTaskSelect(suggestion.taskName, suggestion.hours)}
              className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center justify-between group"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                  {suggestion.taskName}
                </div>
                <div className="text-xs text-gray-500">
                  Used {suggestion.frequency} time{suggestion.frequency !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-3 w-3 mr-1" />
                {formatHours(suggestion.hours)}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick Time Suggestions */}
      {timeSuggestions.length > 0 && (
        <div className="p-2 border-t border-gray-100">
          <div className="flex items-center text-xs font-medium text-gray-500 mb-2">
            <Zap className="h-3 w-3 mr-1" />
            Quick time estimates
          </div>
          <div className="grid grid-cols-2 gap-1">
            {timeSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onTaskSelect(taskName, suggestion.hours)}
                className="text-left p-2 hover:bg-gray-50 rounded text-sm"
              >
                <div className="font-medium text-gray-900">{suggestion.label}</div>
                <div className="text-xs text-gray-500">{formatHours(suggestion.hours)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
