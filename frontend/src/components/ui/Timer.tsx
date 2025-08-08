import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, AlertTriangle } from 'lucide-react';

interface TimerProps {
  onTimeUpdate?: (time: number) => void;
  onComplete?: (totalTime: number) => void;
  autoStart?: boolean;
  className?: string;
  idleDetection?: boolean;
  idleTimeout?: number; // in seconds
}

export const Timer: React.FC<TimerProps> = ({
  onTimeUpdate,
  onComplete,
  autoStart = false,
  className = '',
  idleDetection = true,
  idleTimeout = 300 // 5 minutes default
}) => {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [time, setTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

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
    setIsIdle(false);
    setLastActivity(Date.now());
  }, []);

  // Idle detection
  useEffect(() => {
    if (!idleDetection || !isRunning) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
      setIsIdle(false);
    };

    const checkIdle = () => {
      const now = Date.now();
      const idleTime = now - lastActivity;
      
      if (idleTime > idleTimeout * 1000) {
        setIsIdle(true);
      }
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check for idle every 30 seconds
    const idleInterval = setInterval(checkIdle, 30000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(idleInterval);
    };
  }, [idleDetection, isRunning, lastActivity, idleTimeout]);

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

        {isIdle && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Timer paused - no activity detected
              </span>
            </div>
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
