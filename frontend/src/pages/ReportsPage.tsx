import React, { useEffect, useState } from 'react';
import { useTimesheetStore } from '@/store/timesheetStore';
import { useAuthStore } from '@/store/authStore';
import Charts from '@/components/analytics/Charts';
import { 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Users,
  Clock
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

const ReportsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { fetchTimesheets, timesheets, isLoading, error } = useTimesheetStore();
  
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    fetchTimesheets();
  }, []);

  // Filter timesheets based on selected criteria
  const filteredTimesheets = timesheets.filter(ts => {
    const tsDate = new Date(ts.date);
    const cutoffDate = subDays(new Date(), parseInt(dateRange));
    
    // Date filter
    if (tsDate < cutoffDate) return false;
    
    // Project filter
    if (selectedProject !== 'all' && ts.project.name !== selectedProject) return false;
    
    // User filter
    if (selectedUser !== 'all' && `${ts.user.firstName} ${ts.user.lastName}` !== selectedUser) return false;
    
    return true;
  });

  // Get unique projects and users for filters
  const projects = [...new Set(timesheets.map(ts => ts.project.name))];
  const users = [...new Set(timesheets.map(ts => `${ts.user.firstName} ${ts.user.lastName}`))];

  // Calculate summary statistics
  const totalHours = filteredTimesheets.reduce((sum, ts) => sum + Number(ts.hoursWorked), 0);
  const totalEntries = filteredTimesheets.length;
  const averageHoursPerDay = totalHours / Math.max(1, new Set(filteredTimesheets.map(ts => ts.date)).size);
  const uniqueUsers = new Set(filteredTimesheets.map(ts => `${ts.user.firstName} ${ts.user.lastName}`)).size;

  const exportReport = () => {
    // Create CSV content
    const csvContent = [
      ['Date', 'User', 'Project', 'Task', 'Hours', 'Type', 'Description'].join(','),
      ...filteredTimesheets.map(ts => [
        format(new Date(ts.date), 'yyyy-MM-dd'),
        `${ts.user.firstName} ${ts.user.lastName}`,
        ts.project.name,
        ts.taskName,
        ts.hoursWorked,
        ts.type,
        ts.description || ''
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading reports: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive timesheet analytics and insights</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            {showCharts ? <BarChart3 className="h-4 w-4 mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </button>
          <button
            onClick={exportReport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              Showing {filteredTimesheets.length} of {timesheets.length} entries
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Hours</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalHours.toFixed(1)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Entries</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalEntries}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Hours/Day</dt>
                  <dd className="text-lg font-medium text-gray-900">{averageHoursPerDay.toFixed(1)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{uniqueUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {showCharts && filteredTimesheets.length > 0 && (
        <Charts timesheets={filteredTimesheets} />
      )}

      {/* No Data Message */}
      {filteredTimesheets.length === 0 && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <PieChart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            No timesheet entries match your current filters. Try adjusting the date range or filters.
          </p>
        </div>
      )}

      {/* Recent Entries Table */}
      {filteredTimesheets.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Entries</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTimesheets.slice(0, 10).map((timesheet) => (
                    <tr key={timesheet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(timesheet.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timesheet.user.firstName} {timesheet.user.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timesheet.project.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timesheet.taskName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timesheet.hoursWorked}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {timesheet.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
