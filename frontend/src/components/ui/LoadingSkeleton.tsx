import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'chart' | 'form';
  rows?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type = 'card', 
  rows = 3, 
  className = '' 
}) => {
  const renderCardSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-10 w-10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center space-x-4">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChartSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );

  const skeletons = {
    card: renderCardSkeleton,
    table: renderTableSkeleton,
    chart: renderChartSkeleton,
    form: renderFormSkeleton,
  };

  return (
    <div className={className}>
      {skeletons[type]()}
    </div>
  );
};
