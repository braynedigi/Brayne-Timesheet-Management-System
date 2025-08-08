import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface TimesheetData {
  id: string;
  taskName: string;
  hoursWorked: number;
  date: string;
  type: string;
  description?: string;
  user: {
    firstName: string;
    lastName: string;
  };
  project: {
    name: string;
    client: {
      name: string;
    };
  };
}

interface DashboardChartsProps {
  timesheets: TimesheetData[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ timesheets }) => {
  // Process data for mini charts
  const processData = () => {
    // Last 7 days trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toLocaleDateString();
    }).reverse();

    const dailyData = timesheets.reduce((acc, ts) => {
      const date = new Date(ts.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const weeklyTrendData = last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      hours: dailyData[date] || 0,
    }));

    // Top 3 projects
    const projectData = timesheets.reduce((acc, ts) => {
      const projectName = ts.project.name;
      acc[projectName] = (acc[projectName] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const topProjectsData = Object.entries(projectData)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 3);

    // Work type distribution (top 4)
    const typeData = timesheets.reduce((acc, ts) => {
      acc[ts.type] = (acc[ts.type] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const workTypeData = Object.entries(typeData)
      .map(([type, hours]) => ({ name: type, value: hours }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    // User productivity (top 4)
    const userData = timesheets.reduce((acc, ts) => {
      const userName = `${ts.user.firstName} ${ts.user.lastName}`;
      acc[userName] = (acc[userName] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const userProductivityData = Object.entries(userData)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 4);

    return {
      weeklyTrendData,
      topProjectsData,
      workTypeData,
      userProductivityData,
    };
  };

  const { weeklyTrendData, topProjectsData, workTypeData, userProductivityData } = processData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Trend Mini Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Weekly Hours Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklyTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Projects Mini Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Projects</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topProjectsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10 }}
              stroke="#6B7280"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="hours" fill="#10B981" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Work Type Distribution Mini Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Work Type Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={workTypeData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
            >
              {workTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* User Productivity Mini Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Performers</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={userProductivityData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number" 
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={80}
              tick={{ fontSize: 10 }}
              stroke="#6B7280"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="hours" fill="#F59E0B" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
