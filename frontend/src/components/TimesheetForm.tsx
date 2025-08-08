import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, Clock, FileText, User, Building, Play, Pause, Square } from 'lucide-react';
import { useTimesheetStore, CreateTimesheetData } from '@/store/timesheetStore';
import { Timer } from '@/components/ui/Timer';
import { useNotification } from '@/contexts/NotificationContext';

const timesheetSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  hours: z.number().min(0.1, 'Hours must be at least 0.1').max(24, 'Hours cannot exceed 24'),
  taskName: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  type: z.enum(['WORK', 'MEETING', 'RESEARCH', 'TRAINING', 'BREAK', 'OTHER']),
  projectId: z.string().min(1, 'Project is required'),
});

type TimesheetFormData = z.infer<typeof timesheetSchema>;

interface Project {
  id: string;
  name: string;
  description?: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
}

interface TimesheetFormProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: Project[];
}

const TimesheetForm: React.FC<TimesheetFormProps> = ({ isOpen, onClose, projects = [] }) => {
  const { createTimesheet, isLoading, error, clearError } = useTimesheetStore();
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [trackedTime, setTrackedTime] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      hours: 8,
      type: 'WORK',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
      clearError();
    }
  }, [isOpen, reset, clearError]);

  const onSubmit = async (data: TimesheetFormData) => {
    setIsSubmitting(true);
    try {
      // Use tracked time if available, otherwise use form hours
      const finalData = {
        ...data,
        hours: trackedTime > 0 ? trackedTime / 3600 : data.hours
      };
      await createTimesheet(finalData);
      
      showNotification({
        type: 'success',
        title: 'Timesheet Entry Created',
        message: `Successfully logged ${finalData.hours.toFixed(2)} hours for ${data.taskName}`,
        duration: 3000
      });
      
      onClose();
      setTrackedTime(0);
      setShowTimer(false);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Failed to Create Timesheet',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimerComplete = (totalTime: number) => {
    setTrackedTime(totalTime);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Timesheet Entry</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date
              </label>
              <input
                {...register('date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Hours with Timer */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Hours
                </label>
                <button
                  type="button"
                  onClick={() => setShowTimer(!showTimer)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {showTimer ? (
                    <>
                      <Square className="h-4 w-4 mr-1" />
                      Hide Timer
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Use Timer
                    </>
                  )}
                </button>
              </div>
              
              {showTimer ? (
                <div className="mb-4">
                  <Timer 
                    onComplete={handleTimerComplete}
                    className="mb-3"
                  />
                  {trackedTime > 0 && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      Tracked: {(trackedTime / 3600).toFixed(2)} hours
                    </div>
                  )}
                </div>
              ) : (
                <input
                  {...register('hours', { valueAsNumber: true })}
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="24"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="8.0"
                />
              )}
              {errors.hours && (
                <p className="mt-1 text-sm text-red-600">{errors.hours.message}</p>
              )}
            </div>

            {/* Task Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="inline h-4 w-4 mr-1" />
                Task Name
              </label>
              <input
                {...register('taskName')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Development work, Client meeting"
              />
              {errors.taskName && (
                <p className="mt-1 text-sm text-red-600">{errors.taskName.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional details about the task..."
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="WORK">Work</option>
                <option value="MEETING">Meeting</option>
                <option value="RESEARCH">Research</option>
                <option value="TRAINING">Training</option>
                <option value="BREAK">Break</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building className="inline h-4 w-4 mr-1" />
                Project
              </label>
              <select
                {...register('projectId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} - {project.client.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="mt-1 text-sm text-red-600">{errors.projectId.message}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || isLoading ? 'Creating...' : 'Create Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TimesheetForm;
