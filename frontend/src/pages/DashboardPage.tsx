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
  Settings,
  CalendarRange,
  Award
} from 'lucide-react';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import { InteractiveCharts } from '@/components/dashboard/InteractiveCharts';
import { GoalTracking } from '@/components/dashboard/GoalTracking';
import { CustomDateRangeAnalytics } from '@/components/dashboard/CustomDateRangeAnalytics';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { fetchTimesheets, timesheets, isLoading } = useTimesheetStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'goals' | 'comparison' | 'custom'>('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [stats, setStats] = useState({
    totalHours: 0,
    totalEntries: 0,
    averageHoursPerDay: 0,
    mostActiveDay: '',
    mostActiveProject: '',
    workTypeBreakdown: {} as Record<string, number>,
  });

  useEffect(() => {
    // If user is not admin, only fetch their own timesheets
    if (user && user.role !== 'ADMIN') {
      fetchTimesheets({ userId: user.id });
    } else {
      fetchTimesheets();
    }
  }, [user, fetchTimesheets]);

  useEffect(() => {
    if (timesheets.length > 0) {
      calculateStats();
    }
  }, [timesheets]);

  const calculateStats = () => {
    const totalHours = timesheets.reduce((sum, ts) => sum + Number(ts.hoursWorked), 0);
    const totalEntries = timesheets.length;
    const averageHoursPerDay = totalHours / Math.max(1, new Set(timesheets.map(ts => ts.date)).size);

    // Find most active day
    const dailyHours = timesheets.reduce((acc, ts) => {
      acc[ts.date] = (acc[ts.date] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const mostActiveDay = Object.entries(dailyHours).reduce((max, [date, hours]) => 
      hours > max.hours ? { date, hours } : max, { date: '', hours: 0 }
    ).date;

    // Find most active project
    const projectHours = timesheets.reduce((acc, ts) => {
      acc[ts.project.name] = (acc[ts.project.name] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const mostActiveProject = Object.entries(projectHours).reduce((max, [name, hours]) => 
      hours > max.hours ? { name, hours } : max, { name: '', hours: 0 }
    ).name;

    // Work type breakdown
    const workTypeBreakdown = timesheets.reduce((acc, ts) => {
      acc[ts.type] = (acc[ts.type] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    setStats({
      totalHours,
      totalEntries,
      averageHoursPerDay,
      mostActiveDay,
      mostActiveProject,
      workTypeBreakdown,
    });
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/timesheets?new=true')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'analytics', label: 'Interactive Analytics', icon: TrendingUp },
              { id: 'goals', label: 'Goal Tracking', icon: Target },
              { id: 'comparison', label: 'Team Comparison', icon: Users },
              { id: 'custom', label: 'Custom Analytics', icon: CalendarRange }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <FileText className="h-6 w-6 text-gray-400" />
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
        </>
      )}

      {/* Interactive Analytics Tab */}
      {activeTab === 'analytics' && (
        <InteractiveCharts
          timesheets={timesheets}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedProject={selectedProject}
          selectedUser={selectedUser}
          onProjectSelect={setSelectedProject}
          onUserSelect={setSelectedUser}
        />
      )}

      {/* Goal Tracking Tab */}
      {activeTab === 'goals' && (
        <GoalTracking
          timesheets={timesheets}
          onGoalCreate={(goal) => console.log('Create goal:', goal)}
          onGoalUpdate={(id, updates) => console.log('Update goal:', id, updates)}
          onGoalDelete={(id) => console.log('Delete goal:', id)}
        />
      )}

      {/* Team Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Team Performance Comparison</h2>
              </div>
            </div>
            
            {/* Team Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Active Team Members</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {new Set(timesheets.map(ts => ts.user.id)).size}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Folder className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Active Projects</p>
                    <p className="text-2xl font-bold text-green-900">
                      {new Set(timesheets.map(ts => ts.project.id)).size}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Avg Team Hours/Day</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {(stats.totalHours / Math.max(1, new Set(timesheets.map(ts => ts.date)).size)).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Performance Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entries</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Hours/Entry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from(new Set(timesheets.map(ts => ts.user.id))).map(userId => {
                    const user = timesheets.find(ts => ts.user.id === userId)?.user;
                    const userTimesheets = timesheets.filter(ts => ts.user.id === userId);
                    const totalHours = userTimesheets.reduce((sum, ts) => sum + Number(ts.hoursWorked), 0);
                    const uniqueProjects = new Set(userTimesheets.map(ts => ts.project.id)).size;
                    const avgHoursPerEntry = totalHours / userTimesheets.length;
                    const performance = (totalHours / Math.max(1, new Set(userTimesheets.map(ts => ts.date)).size)).toFixed(1);

                    return (
                      <tr key={userId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user?.firstName} {user?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{totalHours.toFixed(1)}h</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{userTimesheets.length}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{uniqueProjects}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{avgHoursPerEntry.toFixed(1)}h</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${Math.min((parseFloat(performance) / 8) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-900">{performance}h/day</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Custom Analytics Tab */}
      {activeTab === 'custom' && (
        <CustomDateRangeAnalytics timesheets={timesheets} />
      )}
    </div>
  );
};

export default DashboardPage;
