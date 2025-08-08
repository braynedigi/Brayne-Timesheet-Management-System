import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

interface TimerProps {
  onTimeUpdate?: (time: number) => void;
  onComplete?: (totalTime: number) => void;
  autoStart?: boolean;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  onTimeUpdate,
  onComplete,
  autoStart = false,
  className = ''
}) => {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [time, setTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    setTotalTime(prev => prev + time);
    setTime(0);
    onComplete?.(totalTime + time);
  }, [time, totalTime, onComplete]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    setTotalTime(0);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => {
          const newTime = prev + 1;
          onTimeUpdate?.(newTime);
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, onTimeUpdate]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="text-center">
        <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-4">
          {formatTime(time)}
        </div>
        
        {totalTime > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Total: {formatTime(totalTime)}
          </div>
        )}

        <div className="flex justify-center space-x-3">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </button>
          )}

          <button
            onClick={stopTimer}
            disabled={time === 0}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop
          </button>

          <button
            onClick={resetTimer}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
