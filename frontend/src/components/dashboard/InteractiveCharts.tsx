import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
  ComposedChart
} from 'recharts';
import { Calendar, TrendingUp, Target, Users, Clock, Filter, ZoomIn, ZoomOut, ArrowLeft } from 'lucide-react';
import { formatHours, getWorkDayProgress } from '@/utils/timeUtils';

interface TimesheetData {
  id: string;
  date: string;
  hoursWorked: string;
  taskName: string;
  type: string;
  project: {
    id: string;
    name: string;
    client: { name: string };
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface InteractiveChartsProps {
  timesheets: TimesheetData[];
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  selectedProject?: string;
  selectedUser?: string;
  onProjectSelect?: (projectId: string) => void;
  onUserSelect?: (userId: string) => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  timesheets,
  dateRange,
  onDateRangeChange,
  selectedProject,
  selectedUser,
  onProjectSelect,
  onUserSelect
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'users' | 'trends' | 'comparison'>('overview');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'composed'>('bar');
  const [drillDownLevel, setDrillDownLevel] = useState<'none' | 'project' | 'user' | 'date'>('none');
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [comparisonMode, setComparisonMode] = useState<'users' | 'projects' | 'timeframes'>('users');

  // Filter timesheets based on date range and selections
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter(ts => {
      const date = new Date(ts.date);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      
      const inDateRange = date >= start && date <= end;
      const matchesProject = !selectedProject || ts.project.id === selectedProject;
      const matchesUser = !selectedUser || ts.user.id === selectedUser;
      
      return inDateRange && matchesProject && matchesUser;
    });
  }, [timesheets, dateRange, selectedProject, selectedUser]);

  // Daily hours data with drill-down capability
  const dailyData = useMemo(() => {
    const dailyHours: Record<string, number> = {};
    
    filteredTimesheets.forEach(ts => {
      const date = ts.date;
      dailyHours[date] = (dailyHours[date] || 0) + parseFloat(ts.hoursWorked);
    });

    return Object.entries(dailyHours)
      .map(([date, hours]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: parseFloat(hours.toFixed(2)),
        fullDate: date,
        clickable: true
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }, [filteredTimesheets]);

  // Project breakdown with drill-down
  const projectData = useMemo(() => {
    const projectHours: Record<string, { hours: number; entries: number; users: Set<string> }> = {};
    
    filteredTimesheets.forEach(ts => {
      const projectName = ts.project.name;
      if (!projectHours[projectName]) {
        projectHours[projectName] = { hours: 0, entries: 0, users: new Set() };
      }
      projectHours[projectName].hours += parseFloat(ts.hoursWorked);
      projectHours[projectName].entries += 1;
      projectHours[projectName].users.add(ts.user.id);
    });

    return Object.entries(projectHours)
      .map(([name, data]) => ({
        name,
        hours: parseFloat(data.hours.toFixed(2)),
        entries: data.entries,
        uniqueUsers: data.users.size,
        clickable: true
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredTimesheets]);

  // User breakdown with drill-down
  const userData = useMemo(() => {
    const userHours: Record<string, { hours: number; entries: number; projects: Set<string> }> = {};
    
    filteredTimesheets.forEach(ts => {
      const userName = `${ts.user.firstName} ${ts.user.lastName}`;
      if (!userHours[userName]) {
        userHours[userName] = { hours: 0, entries: 0, projects: new Set() };
      }
      userHours[userName].hours += parseFloat(ts.hoursWorked);
      userHours[userName].entries += 1;
      userHours[userName].projects.add(ts.project.id);
    });

    return Object.entries(userHours)
      .map(([name, data]) => ({
        name,
        hours: parseFloat(data.hours.toFixed(2)),
        entries: data.entries,
        uniqueProjects: data.projects.size,
        avgHours: parseFloat((data.hours / data.entries).toFixed(2)),
        clickable: true
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredTimesheets]);

  // Weekly trends data
  const weeklyData = useMemo(() => {
    const weeklyHours: Record<string, number> = {};
    
    filteredTimesheets.forEach(ts => {
      const date = new Date(ts.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      weeklyHours[weekKey] = (weeklyHours[weekKey] || 0) + parseFloat(ts.hoursWorked);
    });

    return Object.entries(weeklyHours)
      .map(([week, hours]) => ({
        week: `Week of ${new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        hours: parseFloat(hours.toFixed(2)),
        fullDate: week
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }, [filteredTimesheets]);

  // Team comparison data
  const comparisonData = useMemo(() => {
    if (comparisonMode === 'users') {
      return userData.map(user => ({
        name: user.name,
        totalHours: user.hours,
        avgHours: user.avgHours,
        efficiency: parseFloat(((user.hours / user.entries) * 10).toFixed(1))
      }));
    } else if (comparisonMode === 'projects') {
      return projectData.map(project => ({
        name: project.name,
        totalHours: project.hours,
        avgHoursPerEntry: parseFloat((project.hours / project.entries).toFixed(2)),
        teamSize: project.uniqueUsers
      }));
    } else {
      // Timeframe comparison (current vs previous period)
      const currentPeriod = filteredTimesheets;
      const previousPeriod = timesheets.filter(ts => {
        const date = new Date(ts.date);
        const currentStart = new Date(dateRange.start);
        const currentEnd = new Date(dateRange.end);
        const periodLength = currentEnd.getTime() - currentStart.getTime();
        const previousStart = new Date(currentStart.getTime() - periodLength);
        const previousEnd = new Date(currentStart.getTime() - 1);
        
        return date >= previousStart && date <= previousEnd;
      });

      const currentTotal = currentPeriod.reduce((sum, ts) => sum + parseFloat(ts.hoursWorked), 0);
      const previousTotal = previousPeriod.reduce((sum, ts) => sum + parseFloat(ts.hoursWorked), 0);
      const change = ((currentTotal - previousTotal) / previousTotal) * 100;

      return [
        {
          period: 'Current Period',
          hours: parseFloat(currentTotal.toFixed(2)),
          entries: currentPeriod.length,
          avgHours: parseFloat((currentTotal / Math.max(1, currentPeriod.length)).toFixed(2))
        },
        {
          period: 'Previous Period',
          hours: parseFloat(previousTotal.toFixed(2)),
          entries: previousPeriod.length,
          avgHours: parseFloat((previousTotal / Math.max(1, previousPeriod.length)).toFixed(2))
        }
      ];
    }
  }, [filteredTimesheets, timesheets, dateRange, userData, projectData, comparisonMode]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} hours
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Handle drill-down
  const handleChartClick = (data: any, chartType: string) => {
    if (!data.clickable) return;

    if (chartType === 'project' && onProjectSelect) {
      const project = projectData.find(p => p.name === data.name);
      if (project) {
        setDrillDownLevel('project');
        setDrillDownData({
          type: 'project',
          name: data.name,
          data: filteredTimesheets.filter(ts => ts.project.name === data.name)
        });
      }
    } else if (chartType === 'user' && onUserSelect) {
      const user = userData.find(u => u.name === data.name);
      if (user) {
        setDrillDownLevel('user');
        setDrillDownData({
          type: 'user',
          name: data.name,
          data: filteredTimesheets.filter(ts => `${ts.user.firstName} ${ts.user.lastName}` === data.name)
        });
      }
    } else if (chartType === 'date') {
      setDrillDownLevel('date');
      setDrillDownData({
        type: 'date',
        name: data.date,
        data: filteredTimesheets.filter(ts => ts.date === data.fullDate)
      });
    }
  };

  // Reset drill-down
  const resetDrillDown = () => {
    setDrillDownLevel('none');
    setDrillDownData(null);
  };

  // Quick date range presets
  const quickDateRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'This month', custom: 'this-month' },
    { label: 'Last month', custom: 'last-month' }
  ];

  const handleQuickDateRange = (range: any) => {
    const end = new Date();
    const start = new Date();
    
    if (range.custom === 'this-month') {
      start.setDate(1);
    } else if (range.custom === 'last-month') {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
    } else {
      start.setDate(end.getDate() - range.days);
    }

    onDateRangeChange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  if (drillDownLevel !== 'none' && drillDownData) {
    return (
      <div className="space-y-6">
        {/* Drill-down Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <button
              onClick={resetDrillDown}
              className="mr-3 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {drillDownData.type.charAt(0).toUpperCase() + drillDownData.type.slice(1)}: {drillDownData.name}
              </h3>
              <p className="text-sm text-gray-500">
                {drillDownData.data.length} entries • {formatHours(drillDownData.data.reduce((sum: number, ts: any) => sum + parseFloat(ts.hoursWorked), 0))} total hours
              </p>
            </div>
          </div>
        </div>

        {/* Drill-down Details */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {drillDownData.data.length}
              </div>
              <div className="text-sm text-gray-500">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatHours(drillDownData.data.reduce((sum: number, ts: any) => sum + parseFloat(ts.hoursWorked), 0))}
              </div>
              <div className="text-sm text-gray-500">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatHours(drillDownData.data.reduce((sum: number, ts: any) => sum + parseFloat(ts.hoursWorked), 0) / Math.max(1, drillDownData.data.length))}
              </div>
              <div className="text-sm text-gray-500">Avg Hours/Entry</div>
            </div>
          </div>

          {/* Detailed Entries Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drillDownData.data.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{entry.taskName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.hoursWorked}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {entry.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Interactive Analytics</h2>
            <div className="flex items-center space-x-2">
              {quickDateRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => handleQuickDateRange(range)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="composed">Composed Chart</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-4 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'projects', label: 'Projects', icon: Target },
            { id: 'users', label: 'Team', icon: Users },
            { id: 'trends', label: 'Trends', icon: Clock },
            { id: 'comparison', label: 'Comparison', icon: Filter }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Content */}
      <div className="bg-white p-6 rounded-lg shadow">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Daily Hours Overview</h4>
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'bar' ? (
                <BarChart data={dailyData} onClick={(data) => handleChartClick(data, 'date')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" fill="#3B82F6" />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={dailyData} onClick={(data) => handleChartClick(data, 'date')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              ) : chartType === 'area' ? (
                <AreaChart data={dailyData} onClick={(data) => handleChartClick(data, 'date')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="hours" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </AreaChart>
              ) : (
                <ComposedChart data={dailyData} onClick={(data) => handleChartClick(data, 'date')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" fill="#3B82F6" fillOpacity={0.6} />
                  <Line type="monotone" dataKey="hours" stroke="#EF4444" strokeWidth={2} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Project Performance</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={projectData} onClick={(data) => handleChartClick(data, 'project')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Team Performance</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={userData} onClick={(data) => handleChartClick(data, 'user')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="hours" fill="#8B5CF6" name="Total Hours" />
                <Bar dataKey="avgHours" fill="#F59E0B" name="Avg Hours/Entry" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Weekly Trends</h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="hours" stroke="#EF4444" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Team Comparison</h4>
              <select
                value={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="users">Compare Users</option>
                <option value="projects">Compare Projects</option>
                <option value="timeframes">Compare Timeframes</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="totalHours" fill="#3B82F6" name="Total Hours" />
                <Line type="monotone" dataKey="avgHours" stroke="#EF4444" strokeWidth={2} name="Avg Hours" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
