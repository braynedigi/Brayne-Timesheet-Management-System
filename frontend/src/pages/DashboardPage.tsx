import React, { useEffect, useState } from 'react';
import { useTimesheetStore } from '@/store/timesheetStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Users, 
  Folder, 
  BarChart3,
  Activity,
  Target,
  Plus,
  FileText,
  Settings
} from 'lucide-react';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { fetchTimesheets, timesheets, isLoading } = useTimesheetStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalHours: 0,
    totalEntries: 0,
    averageHoursPerDay: 0,
    mostActiveDay: '',
    mostActiveProject: '',
    workTypeBreakdown: {} as Record<string, number>,
  });

  useEffect(() => {
    fetchTimesheets();
  }, []);

  useEffect(() => {
    if (timesheets.length > 0) {
      calculateStats();
    }
  }, [timesheets]);

  const calculateStats = () => {
    const totalHours = timesheets.reduce((sum, ts) => sum + parseFloat(ts.hoursWorked), 0);
    const totalEntries = timesheets.length;
    
    // Calculate average hours per day
    const uniqueDays = new Set(timesheets.map(ts => ts.date));
    const averageHoursPerDay = totalHours / uniqueDays.size;

    // Find most active day
    const dayHours: Record<string, number> = {};
    timesheets.forEach(ts => {
      dayHours[ts.date] = (dayHours[ts.date] || 0) + parseFloat(ts.hoursWorked);
    });
    const mostActiveDay = Object.entries(dayHours)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Find most active project
    const projectHours: Record<string, number> = {};
    timesheets.forEach(ts => {
      const projectName = ts.project.name;
      projectHours[projectName] = (projectHours[projectName] || 0) + parseFloat(ts.hoursWorked);
    });
    const mostActiveProject = Object.entries(projectHours)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Work type breakdown
    const workTypeBreakdown: Record<string, number> = {};
    timesheets.forEach(ts => {
      workTypeBreakdown[ts.type] = (workTypeBreakdown[ts.type] || 0) + parseFloat(ts.hoursWorked);
    });

    setStats({
      totalHours,
      totalEntries,
      averageHoursPerDay,
      mostActiveDay,
      mostActiveProject,
      workTypeBreakdown,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      WORK: 'bg-blue-500',
      MEETING: 'bg-purple-500',
      RESEARCH: 'bg-green-500',
      TRAINING: 'bg-yellow-500',
      BREAK: 'bg-gray-500',
      OTHER: 'bg-orange-500',
    };
    return colors[type as keyof typeof colors] || colors.OTHER;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      WORK: 'Work',
      MEETING: 'Meeting',
      RESEARCH: 'Research',
      TRAINING: 'Training',
      BREAK: 'Break',
      OTHER: 'Other',
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.firstName}! Here's your timesheet overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Hours
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalHours.toFixed(1)}h
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Entries
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalEntries}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Hours/Day
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.averageHoursPerDay.toFixed(1)}h
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Days
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {new Set(timesheets.map(ts => ts.date)).size}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Charts */}
      {timesheets.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Analytics Overview</h2>
          <DashboardCharts timesheets={timesheets} />
        </div>
      )}

      {/* Charts and Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Work Type Breakdown */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Work Type Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.workTypeBreakdown)
                .sort(([,a], [,b]) => b - a)
                .map(([type, hours]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${getTypeColor(type)} mr-3`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {getTypeLabel(type)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {hours.toFixed(1)}h
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {timesheets.slice(0, 5).map((timesheet) => (
                <div key={timesheet.id} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${getTypeColor(timesheet.type)}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {timesheet.taskName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {timesheet.project.name} • {formatDate(timesheet.date)}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {parseFloat(timesheet.hoursWorked).toFixed(1)}h
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Key Insights
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start space-x-3">
              <Target className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Most Active Day</p>
                <p className="text-sm text-gray-500">
                  {stats.mostActiveDay ? formatDate(stats.mostActiveDay) : 'No data available'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Folder className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Top Project</p>
                <p className="text-sm text-gray-500">
                  {stats.mostActiveProject || 'No data available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button 
              onClick={() => navigate('/timesheets')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </button>
            {user?.role === 'ADMIN' && (
              <button 
                onClick={() => navigate('/reports')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </button>
            )}
            {user?.role === 'ADMIN' && (
              <button 
                onClick={() => navigate('/users')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </button>
            )}
            <button 
              onClick={() => navigate('/projects')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Folder className="h-4 w-4 mr-2" />
              Manage Projects
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
