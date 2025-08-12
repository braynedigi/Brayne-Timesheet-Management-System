import React, { useEffect, useState, useMemo } from 'react';
import { useTimesheetStore, TimesheetFilters } from '@/store/timesheetStore';
import { useProjectStore } from '@/store/projectStore';
import { useClientStore } from '@/store/clientStore';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import TimesheetForm from '@/components/TimesheetForm';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useNotification } from '@/contexts/NotificationContext';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { BulkTimeEntry, BulkEntry } from '@/components/ui/BulkTimeEntry';
import { exportToPDF, exportToExcel, exportToCSV } from '@/utils/exportUtils';
import { Plus, Filter, Edit, Trash2, Folder, Layers, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const TimesheetsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuthStore();
  const {
    timesheets,
    isLoading,
    error,
    total,
    page,
    totalPages,
    fetchTimesheets,
    createTimesheet,
    deleteTimesheet,
    clearError,
  } = useTimesheetStore();

  const {
    projects,
    fetchProjects,
  } = useProjectStore();

  const {
    clients,
    fetchClients,
  } = useClientStore();

  const {
    users,
    fetchUsers,
  } = useUserStore();

  const [filters, setFilters] = useState<TimesheetFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const { showNotification } = useNotification();

  // Filter clients based on user's projects (employees only see clients they work with)
  const filteredClients = useMemo(() => {
    if (currentUser?.role === 'ADMIN') {
      return clients; // Admin sees all clients
    }
    
    // Employees only see clients from their projects
    const userProjectClientIds = new Set(
      projects
        .filter(project => timesheets.some(ts => ts.project.id === project.id))
        .map(project => project.client.id)
    );
    
    return clients.filter(client => userProjectClientIds.has(client.id));
  }, [clients, projects, timesheets, currentUser?.role]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onAddTimesheet: () => setShowForm(true),
    onEscape: () => {
      setShowForm(false);
      setShowBulkForm(false);
    }
  });

  useEffect(() => {
    fetchTimesheets(filters, page);
  }, [filters, page, fetchTimesheets]);

  // Auto-set user filter for employees (they can only see their own timesheets)
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN' && !filters.userId) {
      setFilters(prev => ({
        ...prev,
        userId: currentUser.id
      }));
    }
  }, [currentUser, filters.userId]);

  useEffect(() => {
    fetchProjects();
    fetchClients();
    fetchUsers();
  }, [fetchProjects, fetchClients, fetchUsers]);

  // Auto-open form if 'new' parameter is present in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  const handleFilterChange = (key: keyof TimesheetFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this timesheet entry?')) {
      try {
        await deleteTimesheet(id);
        showNotification({
          type: 'success',
          title: 'Timesheet Deleted',
          message: 'The timesheet entry has been successfully deleted.',
          duration: 3000
        });
      } catch (error) {
        showNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete the timesheet entry.',
          duration: 5000
        });
      }
    }
  };

  const handleBulkSubmit = async (entries: BulkEntry[]) => {
    try {
      // Create all entries sequentially
      for (const entry of entries) {
        await createTimesheet(entry);
      }
      
      showNotification({
        type: 'success',
        title: 'Bulk Entries Created',
        message: `Successfully created ${entries.length} timesheet entries.`,
        duration: 3000
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Bulk Creation Failed',
        message: 'Failed to create some or all timesheet entries.',
        duration: 5000
      });
    }
  };

  const handleExportPDF = () => {
    try {
      exportToPDF(timesheets, filters);
      showNotification({
        type: 'success',
        title: 'PDF Export',
        message: 'Timesheet report exported to PDF successfully.',
        duration: 3000
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export timesheet report to PDF.',
        duration: 5000
      });
    }
  };

  const handleExportExcel = () => {
    try {
      exportToExcel(timesheets, filters);
      showNotification({
        type: 'success',
        title: 'Excel Export',
        message: 'Timesheet report exported to Excel successfully.',
        duration: 3000
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export timesheet report to Excel.',
        duration: 5000
      });
    }
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(timesheets);
      showNotification({
        type: 'success',
        title: 'CSV Export',
        message: 'Timesheet report exported to CSV successfully.',
        duration: 3000
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export timesheet report to CSV.',
        duration: 5000
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (hours: string) => {
    const hoursNum = parseFloat(hours);
    return `${hoursNum} hour${hoursNum !== 1 ? 's' : ''}`;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      WORK: 'bg-blue-100 text-blue-800',
      MEETING: 'bg-purple-100 text-purple-800',
      RESEARCH: 'bg-green-100 text-green-800',
      TRAINING: 'bg-yellow-100 text-yellow-800',
      BREAK: 'bg-gray-100 text-gray-800',
      OTHER: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || colors.OTHER;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="table" rows={5} />
      </div>
    );
  }

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
              <div className="mt-4">
                <button
                  onClick={clearError}
                  className="text-sm font-medium text-red-800 hover:text-red-600"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your timesheet entries and track your work hours.
          </p>
        </div>
                <div className="flex space-x-2">
          <AnimatedButton
            onClick={() => setShowForm(true)}
            icon={Plus}
            variant="primary"
          >
            Add Entry
          </AnimatedButton>
          <AnimatedButton
            onClick={() => setShowBulkForm(true)}
            icon={Layers}
            variant="secondary"
          >
            Bulk Entry
          </AnimatedButton>
          <div className="flex space-x-1">
            <button
              onClick={handleExportPDF}
              disabled={timesheets.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to PDF"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={timesheets.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to Excel"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </button>
            <button
              onClick={handleExportCSV}
              disabled={timesheets.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to CSV"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="WORK">Work</option>
                  <option value="MEETING">Meeting</option>
                  <option value="RESEARCH">Research</option>
                  <option value="TRAINING">Training</option>
                  <option value="BREAK">Break</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <select
                  value={filters.userId || ''}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={currentUser?.role !== 'ADMIN'}
                >
                  <option value="">All Users</option>
                  {currentUser?.role === 'ADMIN' ? (
                    // Admin can see all users
                    users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))
                  ) : (
                    // Employee only sees their own user info
                    currentUser && (
                      <option value={currentUser.id}>
                        {currentUser.firstName} {currentUser.lastName}
                      </option>
                    )
                  )}
                </select>
                {currentUser?.role !== 'ADMIN' && (
                  <p className="mt-1 text-xs text-gray-500">
                    You can only view your own timesheets
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Client</label>
                <select
                  value={filters.clientId || ''}
                  onChange={(e) => handleFilterChange('clientId', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Clients</option>
                  {filteredClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {currentUser?.role !== 'ADMIN' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Only clients from your projects are shown
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Project</label>
                <select
                  value={filters.projectId || ''}
                  onChange={(e) => handleFilterChange('projectId', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timesheets List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading timesheets...</p>
            </div>
          ) : timesheets.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No timesheets</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new timesheet entry.
              </p>
              <div className="mt-6">
                <button 
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-700">
                  Showing {timesheets.length} of {total} entries
                </p>
              </div>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timesheets.map((timesheet) => (
                      <tr key={timesheet.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {timesheet.taskName}
                            </div>
                            {timesheet.description && (
                              <div className="text-sm text-gray-500">
                                {timesheet.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {timesheet.project.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {timesheet.project.client.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(timesheet.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(timesheet.hoursWorked)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(timesheet.type)}`}>
                            {timesheet.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(timesheet.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchTimesheets(filters, page - 1)}
                      disabled={page <= 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchTimesheets(filters, page + 1)}
                      disabled={page >= totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timesheet Form Modal */}
      <TimesheetForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        projects={projects}
      />

      {/* Bulk Time Entry Modal */}
      <BulkTimeEntry
        isOpen={showBulkForm}
        onClose={() => setShowBulkForm(false)}
        projects={projects}
        onSubmit={handleBulkSubmit}
      />
    </div>
  );
};

export default TimesheetsPage;
