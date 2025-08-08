export type RoundingInterval = 0.25 | 0.5 | 1 | 1.5 | 2;

export interface TimeRoundingOptions {
  interval: RoundingInterval;
  method: 'nearest' | 'up' | 'down';
}

/**
 * Round time to the nearest interval
 */
export const roundTime = (hours: number, options: TimeRoundingOptions): number => {
  const { interval, method } = options;
  
  switch (method) {
    case 'up':
      return Math.ceil(hours / interval) * interval;
    case 'down':
      return Math.floor(hours / interval) * interval;
    case 'nearest':
    default:
      return Math.round(hours / interval) * interval;
  }
};

/**
 * Format hours to display format (e.g., 1.5 -> "1h 30m")
 */
export const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  } else if (wholeHours === 0) {
    return `${minutes}m`;
  } else {
    return `${wholeHours}h ${minutes}m`;
  }
};

/**
 * Convert seconds to hours
 */
export const secondsToHours = (seconds: number): number => {
  return seconds / 3600;
};

/**
 * Convert hours to seconds
 */
export const hoursToSeconds = (hours: number): number => {
  return hours * 3600;
};

/**
 * Format seconds to HH:MM:SS
 */
export const formatSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get suggested time based on previous entries
 */
export const getSuggestedTime = (previousEntries: Array<{ hours: number; taskName: string }>, taskName: string): number => {
  const similarTasks = previousEntries.filter(entry => 
    entry.taskName.toLowerCase().includes(taskName.toLowerCase()) ||
    taskName.toLowerCase().includes(entry.taskName.toLowerCase())
  );
  
  if (similarTasks.length === 0) return 0;
  
  const totalHours = similarTasks.reduce((sum, entry) => sum + entry.hours, 0);
  return totalHours / similarTasks.length;
};

/**
 * Get time suggestions for common tasks
 */
export const getTimeSuggestions = (): Array<{ label: string; hours: number }> => [
  { label: 'Quick task', hours: 0.5 },
  { label: 'Short meeting', hours: 1 },
  { label: 'Standard work session', hours: 2 },
  { label: 'Half day', hours: 4 },
  { label: 'Full day', hours: 8 },
  { label: 'Extended session', hours: 10 },
];

/**
 * Calculate billable amount based on hours and rate
 */
export const calculateBillableAmount = (hours: number, rate: number): number => {
  return hours * rate;
};

/**
 * Get work day progress (assuming 8-hour work day)
 */
export const getWorkDayProgress = (hoursWorked: number, workDayHours: number = 8): number => {
  return Math.min((hoursWorked / workDayHours) * 100, 100);
};
