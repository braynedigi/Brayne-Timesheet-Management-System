import React, { useState, useEffect } from 'react';
import { Task, useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import TaskComments from './TaskComments';
import TaskDetailsModal from './TaskDetailsModal';
import { 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  Circle, 
  AlertCircle,
  Flag,
  MoreHorizontal,
  MessageSquare,
  Edit
} from 'lucide-react';

interface TaskListProps {
  projectId: string;
  projectName: string;
  highlightCommentId?: string | null;
  commentScrollRef?: React.RefObject<HTMLDivElement>;
  onEditTask?: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ projectId, projectName, highlightCommentId, commentScrollRef, onEditTask }) => {
  const { tasks, fetchTasks, deleteTask, isLoading } = useTaskStore();
  const { users, fetchUsers } = useUserStore();
  
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks(projectId);
    fetchUsers();
  }, [projectId, fetchTasks, fetchUsers]);

  // Auto-expand comments if we're highlighting a specific comment
  useEffect(() => {
    if (highlightCommentId && tasks.length > 0) {
      // Find the task that contains the highlighted comment
      // We'll need to check all tasks since the comment might not be loaded yet
      let taskWithComment = tasks.find(task => 
        task.comments?.some(comment => comment.id === highlightCommentId)
      );
      
      // If we can't find it in the loaded comments, check if we can find it by task ID from URL
      if (!taskWithComment) {
        const urlParams = new URLSearchParams(window.location.search);
        const taskId = urlParams.get('task');
        if (taskId) {
          taskWithComment = tasks.find(task => task.id === taskId);
        }
      }
      
      if (taskWithComment) {
        setExpandedComments(taskWithComment.id);
        
        // Scroll to the task after expanding comments
        setTimeout(() => {
          const taskElement = document.querySelector(`[data-task-id="${taskWithComment.id}"]`);
          if (taskElement) {
            taskElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }, 300);
      }
    }
  }, [highlightCommentId, tasks]);

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return <Circle className="h-4 w-4 text-gray-400" />;
      case 'IN_PROGRESS': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'REVIEW': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'LOW': return <Flag className="h-3 w-3 text-green-500" />;
      case 'MEDIUM': return <Flag className="h-3 w-3 text-yellow-500" />;
      case 'HIGH': return <Flag className="h-3 w-3 text-orange-500" />;
      case 'URGENT': return <Flag className="h-3 w-3 text-red-500" />;
      default: return <Flag className="h-3 w-3 text-gray-400" />;
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

  const getAssignedUserName = (assignedTo?: string[]) => {
    if (!assignedTo || assignedTo.length === 0) return 'Unassigned';
    if (assignedTo.length === 1) {
      const user = users.find(u => u.id === assignedTo[0]);
      return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
    }
    return `${assignedTo.length} users assigned`;
  };

  const getAssignedUsersList = (assignedTo?: string[]) => {
    if (!assignedTo || assignedTo.length === 0) return [];
    return assignedTo.map(userId => {
      const user = users.find(u => u.id === userId);
      return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: tasks.filter(t => t.status === 'REVIEW').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    overdue: tasks.filter(t => isOverdue(t.dueDate)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Tasks for {projectName}</h3>
          <p className="text-sm text-gray-500">Manage and track project tasks</p>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
          <div className="text-sm text-gray-500">Total Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-500">{taskStats.todo}</div>
          <div className="text-sm text-gray-500">To Do</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
          <div className="text-sm text-gray-500">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{taskStats.review}</div>
          <div className="text-sm text-gray-500">Review</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
          <div className="text-sm text-gray-500">Overdue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 pr-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 pr-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-6 text-center">
            <Circle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new task using the "New Task" button above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <div 
                key={task.id} 
                data-task-id={task.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('button')) {
                    setSelectedTaskId(task.id);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(task.status)}
                      <h4 className="text-sm font-medium text-gray-900">{task.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getPriorityIcon(task.priority)}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="mt-2 text-sm text-gray-600">{task.description}</p>
                    )}
                    
                    <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <div className="relative group">
                          <span className="cursor-help">{getAssignedUserName(task.assignedTo)}</span>
                          {task.assignedTo && task.assignedTo.length > 1 && (
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap z-10">
                              <div className="font-medium mb-1">Assigned to:</div>
                              {getAssignedUsersList(task.assignedTo).map((userName, index) => (
                                <div key={index}>• {userName}</div>
                              ))}
                              <div className="absolute top-full left-0 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      {task.estimatedHours && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{task.estimatedHours}h estimated</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className={`flex items-center space-x-1 ${isOverdue(task.dueDate) ? 'text-red-600' : ''}`}>
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(task.dueDate)} {isOverdue(task.dueDate) && '(Overdue)'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setExpandedComments(expandedComments === task.id ? null : task.id)}
                      className="text-gray-400 hover:text-blue-600 flex items-center space-x-1"
                      title="View comments"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-xs">{task.commentCount || 0}</span>
                    </button>

                    {onEditTask && (
                      <button
                        onClick={() => onEditTask(task)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Edit task"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Comments Section */}
                {expandedComments === task.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <TaskComments 
                      taskId={task.id} 
                      taskName={task.name} 
                      highlightCommentId={highlightCommentId}
                      commentScrollRef={commentScrollRef}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onEdit={(task) => {
            if (onEditTask) onEditTask(task);
            setSelectedTaskId(null);
          }}
        />
      )}

    </div>
  );
};

export default TaskList;
