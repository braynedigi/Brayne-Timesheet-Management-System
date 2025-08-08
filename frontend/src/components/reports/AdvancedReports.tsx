import React, { useState, useMemo } from 'react';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar, 
  Users, 
  Target,
  TrendingUp,
  Filter,
  Eye,
  Printer,
  Clock,
  DollarSign,
  PieChart,
  Activity
} from 'lucide-react';
import { formatHours, calculateBillableAmount } from '@/utils/timeUtils';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface TimesheetData {
  id: string;
  date: string;
  hoursWorked: string;
  taskName: string;
  description?: string;
  type: string;
  project: {
    id: string;
    name: string;
    client: { name: string; email: string };
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AdvancedReportsProps {
  timesheets: TimesheetData[];
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
}

export const AdvancedReports: React.FC<AdvancedReportsProps> = ({
  timesheets,
  dateRange,
  onDateRangeChange
}) => {
  const [selectedReport, setSelectedReport] = useState<'summary' | 'detailed' | 'billing' | 'productivity' | 'team'>('summary');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [filters, setFilters] = useState({
    project: '',
    user: '',
    type: '',
    minHours: 0,
    maxHours: 24,
    client: ''
  });
  const [showPreview, setShowPreview] = useState(false);

  // Filter timesheets based on date range and filters
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter(ts => {
      const date = new Date(ts.date);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      
      const inDateRange = date >= start && date <= end;
      const matchesProject = !filters.project || ts.project.id === filters.project;
      const matchesUser = !filters.user || ts.user.id === filters.user;
      const matchesType = !filters.type || ts.type === filters.type;
      const matchesClient = !filters.client || ts.project.client.name === filters.client;
      const hours = parseFloat(ts.hoursWorked);
      const matchesHours = hours >= filters.minHours && hours <= filters.maxHours;
      
      return inDateRange && matchesProject && matchesUser && matchesType && matchesClient && matchesHours;
    });
  }, [timesheets, dateRange, filters]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalHours = filteredTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hoursWorked), 0);
    const totalEntries = filteredTimesheets.length;
    const uniqueUsers = new Set(filteredTimesheets.map(ts => ts.user.id)).size;
    const uniqueProjects = new Set(filteredTimesheets.map(ts => ts.project.id)).size;
    const uniqueClients = new Set(filteredTimesheets.map(ts => ts.project.client.name)).size;
    const avgHoursPerEntry = totalHours / Math.max(1, totalEntries);
    const avgHoursPerDay = totalHours / Math.max(1, new Set(filteredTimesheets.map(ts => ts.date)).size);

    return {
      totalHours,
      totalEntries,
      uniqueUsers,
      uniqueProjects,
      uniqueClients,
      avgHoursPerEntry,
      avgHoursPerDay
    };
  }, [filteredTimesheets]);

  // Project breakdown
  const projectBreakdown = useMemo(() => {
    const projectData: Record<string, { hours: number; entries: number; users: Set<string>; billable: number }> = {};
    
    filteredTimesheets.forEach(ts => {
      const projectName = ts.project.name;
      if (!projectData[projectName]) {
        projectData[projectName] = { hours: 0, entries: 0, users: new Set(), billable: 0 };
      }
      const hours = parseFloat(ts.hoursWorked);
      projectData[projectName].hours += hours;
      projectData[projectName].entries += 1;
      projectData[projectName].users.add(ts.user.id);
      // Assume billable rate of $50/hour for demo purposes
      projectData[projectName].billable += hours * 50;
    });

    return Object.entries(projectData)
      .map(([name, data]) => ({
        name,
        hours: parseFloat(data.hours.toFixed(2)),
        entries: data.entries,
        uniqueUsers: data.users.size,
        billable: parseFloat(data.billable.toFixed(2)),
        avgHoursPerEntry: parseFloat((data.hours / data.entries).toFixed(2))
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredTimesheets]);

  // User breakdown
  const userBreakdown = useMemo(() => {
    const userData: Record<string, { hours: number; entries: number; projects: Set<string>; efficiency: number }> = {};
    
    filteredTimesheets.forEach(ts => {
      const userName = `${ts.user.firstName} ${ts.user.lastName}`;
      if (!userData[userName]) {
        userData[userName] = { hours: 0, entries: 0, projects: new Set(), efficiency: 0 };
      }
      const hours = parseFloat(ts.hoursWorked);
      userData[userName].hours += hours;
      userData[userName].entries += 1;
      userData[userName].projects.add(ts.project.id);
    });

    // Calculate efficiency (hours per entry ratio)
    Object.values(userData).forEach(user => {
      user.efficiency = parseFloat((user.hours / user.entries).toFixed(2));
    });

    return Object.entries(userData)
      .map(([name, data]) => ({
        name,
        hours: parseFloat(data.hours.toFixed(2)),
        entries: data.entries,
        uniqueProjects: data.projects.size,
        efficiency: data.efficiency
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredTimesheets]);

  // Daily trends
  const dailyTrends = useMemo(() => {
    const dailyData: Record<string, { hours: number; entries: number; users: Set<string> }> = {};
    
    filteredTimesheets.forEach(ts => {
      const date = ts.date;
      if (!dailyData[date]) {
        dailyData[date] = { hours: 0, entries: 0, users: new Set() };
      }
      dailyData[date].hours += parseFloat(ts.hoursWorked);
      dailyData[date].entries += 1;
      dailyData[date].users.add(ts.user.id);
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: parseFloat(data.hours.toFixed(2)),
        entries: data.entries,
        uniqueUsers: data.users.size,
        fullDate: date
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }, [filteredTimesheets]);

  // Work type distribution
  const workTypeDistribution = useMemo(() => {
    const typeData: Record<string, number> = {};
    
    filteredTimesheets.forEach(ts => {
      typeData[ts.type] = (typeData[ts.type] || 0) + parseFloat(ts.hoursWorked);
    });

    return Object.entries(typeData)
      .map(([type, hours]) => ({
        type,
        hours: parseFloat(hours.toFixed(2)),
        percentage: parseFloat(((hours / summaryStats.totalHours) * 100).toFixed(1))
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredTimesheets, summaryStats.totalHours]);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const data = {
      reportType: selectedReport,
      dateRange,
      summaryStats,
      projectBreakdown,
      userBreakdown,
      dailyTrends,
      workTypeDistribution,
      filteredTimesheets
    };

    if (format === 'csv') {
      exportToCSV(data);
    } else if (format === 'excel') {
      exportToExcel(data);
    } else {
      exportToPDF(data);
    }
  };

  const exportToCSV = (data: any) => {
    let csvContent = '';
    
    if (selectedReport === 'summary') {
      csvContent = [
        ['Report Type', 'Summary Report'],
        ['Date Range', `${dateRange.start} to ${dateRange.end}`],
        [''],
        ['Summary Statistics'],
        ['Total Hours', summaryStats.totalHours],
        ['Total Entries', summaryStats.totalEntries],
        ['Unique Users', summaryStats.uniqueUsers],
        ['Unique Projects', summaryStats.uniqueProjects],
        ['Average Hours per Entry', summaryStats.avgHoursPerEntry],
        ['Average Hours per Day', summaryStats.avgHoursPerDay],
        [''],
        ['Project Breakdown'],
        ['Project', 'Hours', 'Entries', 'Unique Users', 'Billable Amount'],
        ...projectBreakdown.map(p => [p.name, p.hours, p.entries, p.uniqueUsers, p.billable])
      ].map(row => row.join(',')).join('\n');
    } else {
      csvContent = [
        ['Date', 'User', 'Project', 'Client', 'Task', 'Hours', 'Type', 'Description'],
        ...filteredTimesheets.map(ts => [
          ts.date,
          `${ts.user.firstName} ${ts.user.lastName}`,
          ts.project.name,
          ts.project.client.name,
          ts.taskName,
          ts.hoursWorked,
          ts.type,
          ts.description || ''
        ])
      ].map(row => row.join(',')).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-${selectedReport}-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = (data: any) => {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Report Type', selectedReport],
      ['Date Range', `${dateRange.start} to ${dateRange.end}`],
      [''],
      ['Summary Statistics'],
      ['Total Hours', summaryStats.totalHours],
      ['Total Entries', summaryStats.totalEntries],
      ['Unique Users', summaryStats.uniqueUsers],
      ['Unique Projects', summaryStats.uniqueProjects],
      ['Average Hours per Entry', summaryStats.avgHoursPerEntry],
      ['Average Hours per Day', summaryStats.avgHoursPerDay]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Project breakdown sheet
    const projectData = [
      ['Project', 'Hours', 'Entries', 'Unique Users', 'Billable Amount', 'Avg Hours/Entry'],
      ...projectBreakdown.map(p => [p.name, p.hours, p.entries, p.uniqueUsers, p.billable, p.avgHoursPerEntry])
    ];
    
    const projectSheet = XLSX.utils.aoa_to_sheet(projectData);
    XLSX.utils.book_append_sheet(workbook, projectSheet, 'Projects');

    // User breakdown sheet
    const userData = [
      ['User', 'Hours', 'Entries', 'Unique Projects', 'Efficiency'],
      ...userBreakdown.map(u => [u.name, u.hours, u.entries, u.uniqueProjects, u.efficiency])
    ];
    
    const userSheet = XLSX.utils.aoa_to_sheet(userData);
    XLSX.utils.book_append_sheet(workbook, userSheet, 'Users');

    // Detailed timesheet data
    const timesheetData = [
      ['Date', 'User', 'Project', 'Client', 'Task', 'Hours', 'Type', 'Description'],
      ...filteredTimesheets.map(ts => [
        ts.date,
        `${ts.user.firstName} ${ts.user.lastName}`,
        ts.project.name,
        ts.project.client.name,
        ts.taskName,
        ts.hoursWorked,
        ts.type,
        ts.description || ''
      ])
    ];
    
    const timesheetSheet = XLSX.utils.aoa_to_sheet(timesheetData);
    XLSX.utils.book_append_sheet(workbook, timesheetSheet, 'Timesheet Data');

    // Save the file
    XLSX.writeFile(workbook, `timesheet-${selectedReport}-${dateRange.start}-${dateRange.end}.xlsx`);
  };

  const exportToPDF = (data: any) => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Timesheet Report', margin, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Type: ${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)}`, margin, yPos);
    yPos += 8;
    doc.text(`Date Range: ${dateRange.start} to ${dateRange.end}`, margin, yPos);
    yPos += 15;

    // Summary Statistics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryItems = [
      `Total Hours: ${summaryStats.totalHours.toFixed(2)}`,
      `Total Entries: ${summaryStats.totalEntries}`,
      `Unique Users: ${summaryStats.uniqueUsers}`,
      `Unique Projects: ${summaryStats.uniqueProjects}`,
      `Average Hours per Entry: ${summaryStats.avgHoursPerEntry.toFixed(2)}`,
      `Average Hours per Day: ${summaryStats.avgHoursPerDay.toFixed(2)}`
    ];

    summaryItems.forEach(item => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(item, margin, yPos);
      yPos += 6;
    });

    yPos += 10;

    // Project Breakdown
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Breakdown', margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Table headers
    const headers = ['Project', 'Hours', 'Entries', 'Users', 'Billable'];
    const colWidths = [60, 25, 25, 25, 35];
    let xPos = margin;
    
    headers.forEach((header, index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(header, xPos, yPos);
      xPos += colWidths[index];
    });
    yPos += 8;

    // Table data
    projectBreakdown.slice(0, 10).forEach(project => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      xPos = margin;
      doc.setFont('helvetica', 'normal');
      doc.text(project.name.substring(0, 20), xPos, yPos);
      xPos += colWidths[0];
      doc.text(project.hours.toString(), xPos, yPos);
      xPos += colWidths[1];
      doc.text(project.entries.toString(), xPos, yPos);
      xPos += colWidths[2];
      doc.text(project.uniqueUsers.toString(), xPos, yPos);
      xPos += colWidths[3];
      doc.text(`$${project.billable.toFixed(2)}`, xPos, yPos);
      yPos += 6;
    });

    // Save the PDF
    doc.save(`timesheet-${selectedReport}-${dateRange.start}-${dateRange.end}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Advanced Reports</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
          <button
            onClick={() => handleExport(selectedFormat)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export {selectedFormat.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          {[
            { id: 'summary', label: 'Summary', icon: BarChart3 },
            { id: 'detailed', label: 'Detailed', icon: FileText },
            { id: 'billing', label: 'Billing', icon: DollarSign },
            { id: 'productivity', label: 'Productivity', icon: TrendingUp },
            { id: 'team', label: 'Team', icon: Users }
          ].map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                selectedReport === report.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <report.icon className="h-4 w-4 mr-2" />
              {report.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              value={filters.client}
              onChange={(e) => setFilters({ ...filters, client: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Clients</option>
              {Array.from(new Set(timesheets.map(ts => ts.project.client.name))).map(clientName => (
                <option key={clientName} value={clientName}>{clientName}</option>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Hours</label>
            <input
              type="number"
              value={filters.maxHours}
              onChange={(e) => setFilters({ ...filters, maxHours: parseFloat(e.target.value) || 24 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="0"
              step="0.5"
            />
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {showPreview && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Report Preview</h3>
          
          {selectedReport === 'summary' && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Total Hours</p>
                      <p className="text-2xl font-bold text-blue-900">{summaryStats.totalHours.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Total Entries</p>
                      <p className="text-2xl font-bold text-green-900">{summaryStats.totalEntries}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">Active Users</p>
                      <p className="text-2xl font-bold text-purple-900">{summaryStats.uniqueUsers}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-orange-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-orange-600">Projects</p>
                      <p className="text-2xl font-bold text-orange-900">{summaryStats.uniqueProjects}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Breakdown */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Top Projects</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entries</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billable</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projectBreakdown.slice(0, 5).map((project) => (
                        <tr key={project.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.hours}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.entries}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{project.uniqueUsers}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${project.billable}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'detailed' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTimesheets.slice(0, 10).map((timesheet) => (
                    <tr key={timesheet.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{timesheet.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timesheet.user.firstName} {timesheet.user.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{timesheet.project.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{timesheet.taskName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{timesheet.hoursWorked}</td>
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
          )}
        </div>
      )}
    </div>
  );
};
