import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Timesheet } from '@/store/timesheetStore';

export const exportToPDF = (timesheets: Timesheet[], filters: any = {}) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Timesheet Report', 20, 20);
  
  // Add filters info
  doc.setFontSize(12);
  let yPosition = 35;
  
  if (filters.startDate || filters.endDate) {
    const dateRange = `${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`;
    doc.text(`Date Range: ${dateRange}`, 20, yPosition);
    yPosition += 10;
  }
  
  if (filters.type) {
    doc.text(`Type: ${filters.type}`, 20, yPosition);
    yPosition += 10;
  }
  
  if (filters.userId) {
    const user = timesheets.find(t => t.user.id === filters.userId)?.user;
    if (user) {
      doc.text(`User: ${user.firstName} ${user.lastName}`, 20, yPosition);
      yPosition += 10;
    }
  }
  
  if (filters.projectId) {
    const project = timesheets.find(t => t.project.id === filters.projectId)?.project;
    if (project) {
      doc.text(`Project: ${project.name}`, 20, yPosition);
      yPosition += 10;
    }
  }
  
  if (filters.clientId) {
    const client = timesheets.find(t => t.project.client.id === filters.clientId)?.project.client;
    if (client) {
      doc.text(`Client: ${client.name}`, 20, yPosition);
      yPosition += 10;
    }
  }
  
  // Add summary
  const totalHours = timesheets.reduce((sum, t) => sum + parseFloat(t.hoursWorked), 0);
  doc.text(`Total Hours: ${totalHours.toFixed(2)}`, 20, yPosition);
  yPosition += 15;
  
  // Add table headers
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const headers = ['Date', 'Task', 'Description', 'Project', 'Client', 'Hours', 'Type', 'User'];
  const columnWidths = [15, 30, 35, 20, 18, 8, 12, 18];
  let xPosition = 20;
  
  headers.forEach((header, index) => {
    doc.text(header, xPosition, yPosition);
    xPosition += columnWidths[index];
  });
  
  yPosition += 8;
  doc.setFont('helvetica', 'normal');
  
  // Add table data
  timesheets.forEach((timesheet) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    xPosition = 20;
    const rowData = [
      new Date(timesheet.date).toLocaleDateString(),
      timesheet.taskName,
      timesheet.description || '',
      timesheet.project.name,
      timesheet.project.client.name,
      timesheet.hoursWorked,
      timesheet.type,
      `${timesheet.user.firstName} ${timesheet.user.lastName}`
    ];
    
         // Function to wrap text within column width
     const wrapText = (text: string, maxWidth: number) => {
       if (!text) return [''];
       
       const words = text.split(' ');
       const lines: string[] = [];
       let currentLine = '';
       
       words.forEach(word => {
         const testLine = currentLine ? currentLine + ' ' + word : word;
         const testWidth = doc.getTextWidth(testLine);
         
         if (testWidth <= maxWidth) {
           currentLine = testLine;
         } else {
           if (currentLine) {
             lines.push(currentLine);
             currentLine = word;
           } else {
             // Word is too long, truncate it
             const maxChars = Math.floor(maxWidth / 2);
             lines.push(word.length > maxChars ? word.substring(0, maxChars) + '...' : word);
             currentLine = '';
           }
         }
       });
       
       if (currentLine) {
         lines.push(currentLine);
       }
       
       return lines.length > 0 ? lines : [''];
     };
    
    // Calculate row height based on content
    let maxLines = 1;
    rowData.forEach((cell, index) => {
      const lines = wrapText(cell, columnWidths[index] - 2);
      maxLines = Math.max(maxLines, lines.length);
    });
    
    // Draw row data
    rowData.forEach((cell, index) => {
      const lines = wrapText(cell, columnWidths[index] - 2);
      
             lines.forEach((line, lineIndex) => {
         doc.text(line, xPosition, yPosition + (lineIndex * 3.5));
       });
       
       xPosition += columnWidths[index];
     });
     
     yPosition += (maxLines * 3.5) + 1;
  });
  
  // Add footer
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 20, 280);
  
  // Save the PDF
  doc.save(`timesheet-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToExcel = (timesheets: Timesheet[], filters: any = {}) => {
  // Prepare data for Excel
  const data = timesheets.map(timesheet => ({
    Date: new Date(timesheet.date).toLocaleDateString(),
    Task: timesheet.taskName,
    Description: timesheet.description || '',
    Project: timesheet.project.name,
    Client: timesheet.project.client.name,
    Hours: parseFloat(timesheet.hoursWorked),
    Type: timesheet.type,
    User: `${timesheet.user.firstName} ${timesheet.user.lastName}`,
    Created: new Date(timesheet.createdAt).toLocaleString(),
  }));
  
  // Add summary row
  const totalHours = timesheets.reduce((sum, t) => sum + parseFloat(t.hoursWorked), 0);
  data.push({
    Date: '',
    Task: '',
    Description: '',
    Project: '',
    Client: '',
    Hours: totalHours,
    Type: 'OTHER',
    User: '',
    Created: '',
  });
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const columnWidths = [
    { wch: 12 }, // Date
    { wch: 40 }, // Task
    { wch: 50 }, // Description
    { wch: 25 }, // Project
    { wch: 25 }, // Client
    { wch: 10 }, // Hours
    { wch: 15 }, // Type
    { wch: 20 }, // User
    { wch: 20 }, // Created
  ];
  ws['!cols'] = columnWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Timesheets');
  
  // Add metadata sheet
  const metadata = [
    { Field: 'Report Type', Value: 'Timesheet Export' },
    { Field: 'Generated Date', Value: new Date().toLocaleString() },
    { Field: 'Total Records', Value: timesheets.length },
    { Field: 'Total Hours', Value: totalHours.toFixed(2) },
  ];
  
  if (filters.startDate) metadata.push({ Field: 'Start Date', Value: filters.startDate });
  if (filters.endDate) metadata.push({ Field: 'End Date', Value: filters.endDate });
  if (filters.type) metadata.push({ Field: 'Type Filter', Value: filters.type });
  if (filters.userId) {
    const user = timesheets.find(t => t.user.id === filters.userId)?.user;
    if (user) metadata.push({ Field: 'User Filter', Value: `${user.firstName} ${user.lastName}` });
  }
  if (filters.projectId) {
    const project = timesheets.find(t => t.project.id === filters.projectId)?.project;
    if (project) metadata.push({ Field: 'Project Filter', Value: project.name });
  }
  if (filters.clientId) {
    const client = timesheets.find(t => t.project.client.id === filters.clientId)?.project.client;
    if (client) metadata.push({ Field: 'Client Filter', Value: client.name });
  }
  
  const metadataWs = XLSX.utils.json_to_sheet(metadata);
  metadataWs['!cols'] = [{ wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, metadataWs, 'Metadata');
  
  // Save the Excel file
  XLSX.writeFile(wb, `timesheet-report-${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToCSV = (timesheets: Timesheet[]) => {
  const headers = ['Date', 'Task', 'Description', 'Project', 'Client', 'Hours', 'Type', 'User', 'Created'];
  const csvData = timesheets.map(timesheet => [
    new Date(timesheet.date).toLocaleDateString(),
    timesheet.taskName,
    timesheet.description || '',
    timesheet.project.name,
    timesheet.project.client.name,
    timesheet.hoursWorked,
    timesheet.type,
    `${timesheet.user.firstName} ${timesheet.user.lastName}`,
    new Date(timesheet.createdAt).toLocaleString(),
  ]);
  
  // Add headers
  csvData.unshift(headers);
  
  // Convert to CSV string
  const csvContent = csvData.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `timesheet-report-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
