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

interface ChartsProps {
  timesheets: TimesheetData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const Charts: React.FC<ChartsProps> = ({ timesheets }) => {
  // Process data for charts
  const processData = () => {
    // Daily hours chart data
    const dailyData = timesheets.reduce((acc, ts) => {
      const date = new Date(ts.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const dailyChartData = Object.entries(dailyData)
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 days

    // Project breakdown
    const projectData = timesheets.reduce((acc, ts) => {
      const projectName = ts.project.name;
      acc[projectName] = (acc[projectName] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const projectChartData = Object.entries(projectData)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5); // Top 5 projects

    // Work type breakdown
    const typeData = timesheets.reduce((acc, ts) => {
      acc[ts.type] = (acc[ts.type] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const typeChartData = Object.entries(typeData).map(([type, hours]) => ({
      name: type,
      value: hours,
    }));

    // User productivity
    const userData = timesheets.reduce((acc, ts) => {
      const userName = `${ts.user.firstName} ${ts.user.lastName}`;
      acc[userName] = (acc[userName] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const userChartData = Object.entries(userData)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours);

    // Weekly trend
    const weeklyData = timesheets.reduce((acc, ts) => {
      const date = new Date(ts.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toLocaleDateString();
      acc[weekKey] = (acc[weekKey] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const weeklyChartData = Object.entries(weeklyData)
      .map(([week, hours]) => ({ week, hours }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
      .slice(-8); // Last 8 weeks

    return {
      dailyChartData,
      projectChartData,
      typeChartData,
      userChartData,
      weeklyChartData,
    };
  };

  const { dailyChartData, projectChartData, typeChartData, userChartData, weeklyChartData } = processData();

  return (
    <div className="space-y-6">
      {/* Daily Hours Trend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Hours Trend (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Project Hours Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Hours Breakdown (Top 5)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={projectChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="hours" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Work Type Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Type Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={typeChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {typeChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* User Productivity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Productivity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={userChartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Legend />
            <Bar dataKey="hours" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Trend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Hours Trend (Last 8 Weeks)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={weeklyChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
