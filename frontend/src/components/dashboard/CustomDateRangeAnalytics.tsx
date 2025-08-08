import React, { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Users,
  Clock,
  Filter,
  Download,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { formatHours } from '@/utils/timeUtils';

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

interface CustomDateRangeAnalyticsProps {
  timesheets: TimesheetData[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const CustomDateRangeAnalytics: React.FC<CustomDateRangeAnalyticsProps> = ({
  timesheets
}) => {
  const [dateRange1, setDateRange1] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [dateRange2, setDateRange2] = useState({
    start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [comparisonMode, setComparisonMode] = useState<'ranges' | 'trends' | 'breakdown'>('ranges');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [filters, setFilters] = useState({
    project: '',
    user: '',
    type: '',
    minHours: 0
  });

  // Filter timesheets for each date range
  const filteredTimesheets1 = useMemo(() => {
    return timesheets.filter(ts => {
      const date = new Date(ts.date);
      const start = new Date(dateRange1.start);
      const end = new Date(dateRange1.end);
      
      const inDateRange = date >= start && date <= end;
      const matchesProject = !filters.project || ts.project.id === filters.project;
      const matchesUser = !filters.user || ts.user.id === filters.user;
      const matchesType = !filters.type || ts.type === filters.type;
      const matchesHours = parseFloat(ts.hoursWorked) >= filters.minHours;
      
      return inDateRange && matchesProject && matchesUser && matchesType && matchesHours;
    });
  }, [timesheets, dateRange1, filters]);

  const filteredTimesheets2 = useMemo(() => {
    return timesheets.filter(ts => {
      const date = new Date(ts.date);
      const start = new Date(dateRange2.start);
      const end = new Date(dateRange2.end);
      
      const inDateRange = date >= start && date <= end;
      const matchesProject = !filters.project || ts.project.id === filters.project;
      const matchesUser = !filters.user || ts.user.id === filters.user;
      const matchesType = !filters.type || ts.type === filters.type;
      const matchesHours = parseFloat(ts.hoursWorked) >= filters.minHours;
      
      return inDateRange && matchesProject && matchesUser && matchesType && matchesHours;
    });
  }, [timesheets, dateRange2, filters]);

  // Calculate statistics for each range
  const stats1 = useMemo(() => {
    const totalHours = filteredTimesheets1.reduce((sum, ts) => sum + parseFloat(ts.hoursWorked), 0);
    const totalEntries = filteredTimesheets1.length;
    const uniqueUsers = new Set(filteredTimesheets1.map(ts => ts.user.id)).size;
    const uniqueProjects = new Set(filteredTimesheets1.map(ts => ts.project.id)).size;
    const avgHoursPerDay = totalHours / Math.max(1, new Set(filteredTimesheets1.map(ts => ts.date)).size);
    
    return { totalHours, totalEntries, uniqueUsers, uniqueProjects, avgHoursPerDay };
  }, [filteredTimesheets1]);

  const stats2 = useMemo(() => {
    const totalHours = filteredTimesheets2.reduce((sum, ts) => sum + parseFloat(ts.hoursWorked), 0);
    const totalEntries = filteredTimesheets2.length;
    const uniqueUsers = new Set(filteredTimesheets2.map(ts => ts.user.id)).size;
    const uniqueProjects = new Set(filteredTimesheets2.map(ts => ts.project.id)).size;
    const avgHoursPerDay = totalHours / Math.max(1, new Set(filteredTimesheets2.map(ts => ts.date)).size);
    
    return { totalHours, totalEntries, uniqueUsers, uniqueProjects, avgHoursPerDay };
  }, [filteredTimesheets2]);

  // Daily trends data
  const dailyTrends1 = useMemo(() => {
    const dailyData: Record<string, number> = {};
    filteredTimesheets1.forEach(ts => {
      const date = ts.date;
      dailyData[date] = (dailyData[date] || 0) + parseFloat(ts.hoursWorked);
    });

    return Object.entries(dailyData)
      .map(([date, hours]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: parseFloat(hours.toFixed(2)),
        fullDate: date
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }, [filteredTimesheets1]);

  const dailyTrends2 = useMemo(() => {
    const dailyData: Record<string, number> = {};
    filteredTimesheets2.forEach(ts => {
      const date = ts.date;
      dailyData[date] = (dailyData[date] || 0) + parseFloat(ts.hoursWorked);
    });

    return Object.entries(dailyData)
      .map(([date, hours]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: parseFloat(hours.toFixed(2)),
        fullDate: date
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }, [filteredTimesheets2]);

  // Project breakdown
  const projectBreakdown1 = useMemo(() => {
    const projectData: Record<string, number> = {};
    filteredTimesheets1.forEach(ts => {
      const projectName = ts.project.name;
      projectData[projectName] = (projectData[projectName] || 0) + parseFloat(ts.hoursWorked);
    });

    return Object.entries(projectData)
      .map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(2)) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  }, [filteredTimesheets1]);

  const projectBreakdown2 = useMemo(() => {
    const projectData: Record<string, number> = {};
    filteredTimesheets2.forEach(ts => {
      const projectName = ts.project.name;
      projectData[projectName] = (projectData[projectName] || 0) + parseFloat(ts.hoursWorked);
    });

    return Object.entries(projectData)
      .map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(2)) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  }, [filteredTimesheets2]);

  // Comparison data
  const comparisonData = useMemo(() => {
    const categories = ['Total Hours', 'Total Entries', 'Unique Users', 'Unique Projects', 'Avg Hours/Day'];
    const range1Values = [stats1.totalHours, stats1.totalEntries, stats1.uniqueUsers, stats1.uniqueProjects, stats1.avgHoursPerDay];
    const range2Values = [stats2.totalHours, stats2.totalEntries, stats2.uniqueUsers, stats2.uniqueProjects, stats2.avgHoursPerDay];

    return categories.map((category, index) => ({
      category,
      range1: range1Values[index],
      range2: range2Values[index],
      change: range1Values[index] > 0 ? ((range1Values[index] - range2Values[index]) / range2Values[index]) * 100 : 0
    }));
  }, [stats1, stats2]);

  // Custom tooltip
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

  // Quick date presets
  const quickPresets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'This month', custom: 'this-month' },
    { label: 'Last month', custom: 'last-month' }
  ];

  const applyQuickPreset = (preset: any, rangeNum: 1 | 2) => {
    const end = new Date();
    const start = new Date();
    
    if (preset.custom === 'this-month') {
      start.setDate(1);
    } else if (preset.custom === 'last-month') {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
    } else {
      start.setDate(end.getDate() - preset.days);
    }

    const newRange = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };

    if (rangeNum === 1) {
      setDateRange1(newRange);
    } else {
      setDateRange2(newRange);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CalendarRange className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Custom Date Range Analytics</h2>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={comparisonMode}
            onChange={(e) => setComparisonMode(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="ranges">Range Comparison</option>
            <option value="trends">Trend Analysis</option>
            <option value="breakdown">Breakdown</option>
          </select>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="area">Area Chart</option>
          </select>
        </div>
      </div>

      {/* Date Range Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Range 1 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Date Range 1</h3>
            <div className="flex space-x-1">
              {quickPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyQuickPreset(preset, 1)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange1.start}
                onChange={(e) => setDateRange1({ ...dateRange1, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange1.end}
                onChange={(e) => setDateRange1({ ...dateRange1, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          {/* Range 1 Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats1.totalHours.toFixed(1)}</div>
              <div className="text-sm text-gray-500">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats1.totalEntries}</div>
              <div className="text-sm text-gray-500">Entries</div>
            </div>
          </div>
        </div>

        {/* Range 2 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Date Range 2</h3>
            <div className="flex space-x-1">
              {quickPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyQuickPreset(preset, 2)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange2.start}
                onChange={(e) => setDateRange2({ ...dateRange2, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange2.end}
                onChange={(e) => setDateRange2({ ...dateRange2, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          {/* Range 2 Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats2.totalHours.toFixed(1)}</div>
              <div className="text-sm text-gray-500">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats2.totalEntries}</div>
              <div className="text-sm text-gray-500">Entries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={filters.project}
              onChange={(e) => setFilters({ ...filters, project: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Projects</option>
              {Array.from(new Set(timesheets.map(ts => ts.project.id))).map(projectId => {
                const project = timesheets.find(ts => ts.project.id === projectId)?.project;
                return (
                  <option key={projectId} value={projectId}>
                    {project?.name}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Users</option>
              {Array.from(new Set(timesheets.map(ts => ts.user.id))).map(userId => {
                const user = timesheets.find(ts => ts.user.id === userId)?.user;
                return (
                  <option key={userId} value={userId}>
                    {user ? `${user.firstName} ${user.lastName}` : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              {Array.from(new Set(timesheets.map(ts => ts.type))).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Hours</label>
            <input
              type="number"
              value={filters.minHours}
              onChange={(e) => setFilters({ ...filters, minHours: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              step="0.5"
            />
          </div>
        </div>
      </div>

      {/* Comparison Content */}
      {comparisonMode === 'ranges' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Range Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Range 1</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Range 2</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparisonData.map((item) => (
                  <tr key={item.category}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof item.range1 === 'number' ? item.range1.toFixed(2) : item.range1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof item.range2 === 'number' ? item.range2.toFixed(2) : item.range2}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.change > 0 ? 'bg-green-100 text-green-800' :
                        item.change < 0 ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {comparisonMode === 'trends' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Trends Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  data={dailyTrends1}
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Range 1"
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  data={dailyTrends2}
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Range 2"
                />
              </LineChart>
            ) : chartType === 'bar' ? (
              <BarChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="hours" data={dailyTrends1} fill="#3B82F6" name="Range 1" />
                <Bar dataKey="hours" data={dailyTrends2} fill="#EF4444" name="Range 2" />
              </BarChart>
            ) : (
              <AreaChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  data={dailyTrends1}
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                  name="Range 1"
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  data={dailyTrends2}
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.3}
                  name="Range 2"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {comparisonMode === 'breakdown' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Range 1 Project Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Range 1 - Top Projects</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={projectBreakdown1}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {projectBreakdown1.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Range 2 Project Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Range 2 - Top Projects</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={projectBreakdown2}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {projectBreakdown2.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
