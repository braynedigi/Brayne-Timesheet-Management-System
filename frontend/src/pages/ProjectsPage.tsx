import React, { useEffect, useState, useRef } from 'react';
import { useProjectStore, Project, CreateProjectData, UpdateProjectData } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Building, User, Calendar, Clock, CheckSquare, FileText } from 'lucide-react';
import ProjectForm from '@/components/ProjectForm';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';
import { useNotification } from '@/contexts/NotificationContext';
import { useTaskStore, CreateTaskData, Task } from '@/store/taskStore';

const ProjectsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { projects, fetchProjects, createProject, updateProject, deleteProject, isLoading, error } = useProjectStore();
  const { createTask, updateTask } = useTaskStore();
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects');
  
  // New state for search, filters, and view
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Refs for scrolling to specific elements
  const commentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle URL parameters for auto-navigation
  useEffect(() => {
    const taskId = searchParams.get('task');
    const commentId = searchParams.get('comment');
    const scrollToComment = searchParams.get('scroll') === 'true';
    
    if (taskId && projects.length > 0) {
      // First, we need to get the task to find which project it belongs to
      const getTaskAndNavigate = async () => {
        try {
          const { getTaskById } = useTaskStore.getState();
          await getTaskById(taskId);
          const task = useTaskStore.getState().currentTask;
          
          if (task) {
            // Find the project that contains this task
            const targetProject = projects.find(p => p.id === task.projectId);
            
            if (targetProject) {
              // Set the selected project and switch to tasks tab
              setSelectedProject(targetProject);
              setActiveTab('tasks');
              
              // If we need to scroll to a specific comment, do it after a short delay
              if (scrollToComment && commentId) {
                setTimeout(() => {
                  if (commentScrollRef.current) {
                    commentScrollRef.current.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center' 
                    });
                  }
                }, 1000); // Increased delay to ensure everything is loaded
              }
            }
          }
        } catch (error) {
          console.error('Failed to navigate to task:', error);
        }
      };
      
      getTaskAndNavigate();
    }
  }, [searchParams, projects]);

  const handleCreateProject = async (data: CreateProjectData) => {
    try {
      await createProject(data);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowCreateForm(true);
  };

  const handleUpdateProject = async (id: string, data: UpdateProjectData) => {
    try {
      await updateProject(id, data);
      setEditingProject(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(projectId);
        // If we're viewing tasks for this project, go back to projects list
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
          setActiveTab('projects');
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleViewTasks = (project: Project) => {
    setSelectedProject(project);
    setActiveTab('tasks');
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || 
                           (project.category && project.category.split(',').includes(categoryFilter));
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const isAdmin = user?.role === 'ADMIN';

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="text-red-400">⚠️</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your projects and track their progress.
          </p>
        </div>
        {activeTab === 'projects' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </button>
        )}
        {activeTab === 'tasks' && selectedProject && (
          <button
            onClick={() => {
              setEditingTask(null);
              setShowTaskForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FileText className="h-4 w-4 mr-2" />
            New Task
          </button>
        )}
      </div>

      {/* Search, Filters, and View Toggle */}
      {activeTab === 'projects' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filters and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="DEV">Development</option>
                    <option value="SEO">SEO</option>
                    <option value="AI">AI</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="GRAPHICS">Graphics</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="TODO">To Do</option>
                    <option value="DOING">Doing</option>
                    <option value="WAITING_FOR_APPROVAL">Waiting for Approval</option>
                    <option value="STALLED">Stalled</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="WAITING_ON_CLIENT">Waiting on Client</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">View:</span>
                <div className="flex border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm font-medium ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } border-r border-gray-300 rounded-l-md`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm font-medium ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } rounded-r-md`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('projects');
              setSelectedProject(null);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="h-4 w-4 inline mr-2" />
            Projects
          </button>
          {selectedProject && (
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckSquare className="h-4 w-4 inline mr-2" />
              Tasks - {selectedProject.name}
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'projects' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new project.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                    <div key={project.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-6">
                        {/* Project Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-3">
                              {project.description || 'No description'}
                            </p>
                          </div>
                          {isAdmin && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(project)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(project.id)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Client Info */}
                        <div className="flex items-center space-x-2 mb-4">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {project.client.name}
                          </span>
                        </div>

                        {/* Project Stats */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Timesheets</p>
                            <p className="font-medium text-gray-900">
                              {project._count?.timesheets || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Status</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              project.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {project.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        {/* Category and Status */}
                        <div className="mt-4 space-y-2">
                                                     <div className="flex items-center space-x-2">
                             <span className="text-xs font-medium text-gray-500">Categories:</span>
                             <div className="flex flex-wrap gap-1">
                               {project.category?.split(',').map((cat, index) => (
                                 <span key={index} className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800`}>
                                   {cat.replace('_', ' ')}
                                 </span>
                               )) || <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">DEV</span>}
                             </div>
                           </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-500">Status:</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              project.status === 'DOING' ? 'bg-blue-100 text-blue-800' :
                              project.status === 'WAITING_FOR_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                              project.status === 'STALLED' ? 'bg-orange-100 text-orange-800' :
                              project.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              project.status === 'WAITING_ON_CLIENT' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {project.status?.replace(/_/g, ' ') || 'TODO'}
                            </span>
                          </div>
                        </div>

                        {/* Project Dates */}
                        {(project.startDate || project.endDate) && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              {project.startDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Start: {formatDate(project.startDate)}</span>
                                </div>
                              )}
                              {project.endDate && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>End: {formatDate(project.endDate)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-4 flex space-x-2">
                          <button
                            onClick={() => handleViewTasks(project)}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <CheckSquare className="h-4 w-4 mr-2" />
                            View Tasks
                          </button>
                        </div>

                        {/* Project Dates */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Created: {formatDate(project.createdAt)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Updated: {formatDate(project.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-4">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                                                     <div className="flex items-center space-x-4">
                             <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                             <div className="flex flex-wrap gap-1">
                               {project.category?.split(',').map((cat, index) => (
                                 <span key={index} className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800`}>
                                   {cat.replace('_', ' ') || 'DEV'}
                                 </span>
                               )) || <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">DEV</span>}
                             </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              project.status === 'DOING' ? 'bg-blue-100 text-blue-800' :
                              project.status === 'WAITING_FOR_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                              project.status === 'STALLED' ? 'bg-orange-100 text-orange-800' :
                              project.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              project.status === 'WAITING_ON_CLIENT' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {project.status?.replace(/_/g, ' ') || 'TODO'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{project.description || 'No description'}</p>
                          <div className="flex items-center space-x-6 mt-2 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{project.client.name}</span>
                            </span>
                            {project.startDate && (
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Start: {formatDate(project.startDate)}</span>
                              </span>
                            )}
                            {project.endDate && (
                              <span className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>End: {formatDate(project.endDate)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewTasks(project)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <CheckSquare className="h-4 w-4 mr-2" />
                            View Tasks
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleEdit(project)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(project.id)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && selectedProject && (
        <TaskList 
          projectId={selectedProject.id} 
          projectName={selectedProject.name} 
          highlightCommentId={searchParams.get('comment')}
          commentScrollRef={commentScrollRef}
          onEditTask={handleEditTask}
        />
      )}

      {/* Create/Edit Project Modal */}
      {showCreateForm && (
        <ProjectForm
          project={editingProject}
          isOpen={showCreateForm}
          onClose={() => {
            setShowCreateForm(false);
            setEditingProject(null);
          }}
          onSubmit={async (data) => {
            try {
              if (editingProject) {
                await handleUpdateProject(editingProject.id, data);
              } else {
                await handleCreateProject(data as CreateProjectData);
              }
            } catch (error) {
              console.error('Failed to save project:', error);
            }
          }}
        />
      )}

      {/* Create Task Modal */}
      {showTaskForm && selectedProject && (
        <TaskForm
          task={editingTask || undefined}
          isOpen={showTaskForm}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          projects={[selectedProject]}
          onSubmit={async (data) => {
            try {
              if (editingTask) {
                await updateTask(editingTask.id, data);
                setShowTaskForm(false);
                setEditingTask(null);
                showNotification({
                  type: 'success',
                  title: 'Task Updated',
                  message: 'The task has been successfully updated.',
                  duration: 3000
                });
              } else {
                await createTask(data as CreateTaskData);
                setShowTaskForm(false);
                showNotification({
                  type: 'success',
                  title: 'Task Created',
                  message: 'The task has been successfully created.',
                  duration: 3000
                });
              }
            } catch (error) {
              showNotification({
                type: 'error',
                title: editingTask ? 'Task Update Failed' : 'Task Creation Failed',
                message: `Failed to ${editingTask ? 'update' : 'create'} the task.`,
                duration: 5000
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
