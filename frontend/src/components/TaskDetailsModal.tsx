import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Clock, User, Calendar, Edit } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import TaskComments from './TaskComments';

interface TaskDetailsModalProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: any) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ taskId, isOpen, onClose, onEdit }) => {
  const { currentTask, getTaskById, clearCurrentTask } = useTaskStore();
  const { users } = useUserStore();

  useEffect(() => {
    if (isOpen && taskId) {
      getTaskById(taskId);
    }
    return () => clearCurrentTask();
  }, [isOpen, taskId, getTaskById, clearCurrentTask]);

  if (!isOpen || !currentTask) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const assignedUsers = currentTask.assignedTo?.map(userId => 
    users.find(u => u.id === userId)
  ).filter(Boolean) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">{currentTask.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column: Basic info */}
          <div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentTask.status)}`}>
                  {currentTask.status.replace('_', ' ')}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(currentTask.priority)}`}>
                  {currentTask.priority}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                <div className="flex items-center text-gray-900">
                  <Clock size={16} className="mr-2" />
                  {currentTask.estimatedHours || 'Not set'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <div className="flex items-center text-gray-900">
                  <Calendar size={16} className="mr-2" />
                  {currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : 'Not set'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                {assignedUsers.length > 0 ? (
                  <ul className="space-y-1">
                    {assignedUsers.map(user => (
                      <li key={user.id} className="flex items-center text-gray-900">
                        <User size={16} className="mr-2" />
                        {user.firstName} {user.lastName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No assignments</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Right column: Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <p className="text-gray-900 whitespace-pre-wrap">
              {currentTask.description || 'No description provided'}
            </p>
          </div>
        </div>
        
        {/* Comments section */}
        <div className="border-t p-6">
          <TaskComments taskId={currentTask.id} taskName={currentTask.name} />
        </div>
        
        <div className="flex justify-end p-6 border-t">
          <button 
            onClick={() => {
              onEdit(currentTask);
              onClose();
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit size={16} className="mr-2" />
            Edit Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
