import React, { useEffect, useState } from 'react';
import { useProjectStore, Project, CreateProjectData, UpdateProjectData } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { Plus, Edit, Trash2, Building, User, Calendar, Clock, CheckSquare } from 'lucide-react';
import ProjectForm from '@/components/ProjectForm';
import TaskList from '@/components/TaskList';

const ProjectsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { projects, fetchProjects, createProject, updateProject, deleteProject, isLoading, error } = useProjectStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects');

  useEffect(() => {
    fetchProjects();
  }, []);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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
        {isAdmin && activeTab === 'projects' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </button>
        )}
      </div>

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
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new project.
                </p>
                {isAdmin && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
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
          onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
