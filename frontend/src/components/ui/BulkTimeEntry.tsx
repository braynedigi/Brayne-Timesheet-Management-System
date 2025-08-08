import React, { useState } from 'react';
import { X, Plus, Calendar, Clock, FileText, Building } from 'lucide-react';
import { formatHours } from '@/utils/timeUtils';

interface BulkTimeEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entries: BulkEntry[]) => void;
  projects: Array<{
    id: string;
    name: string;
    client: { name: string };
  }>;
}

export interface BulkEntry {
  date: string;
  hours: number;
  taskName: string;
  description?: string;
  type: 'WORK' | 'MEETING' | 'RESEARCH' | 'TRAINING' | 'BREAK' | 'OTHER';
  projectId: string;
}

export const BulkTimeEntry: React.FC<BulkTimeEntryProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects
}) => {
  const [entries, setEntries] = useState<BulkEntry[]>([
    {
      date: new Date().toISOString().split('T')[0],
      hours: 8,
      taskName: '',
      description: '',
      type: 'WORK',
      projectId: ''
    }
  ]);

  const [template, setTemplate] = useState({
    taskName: '',
    description: '',
    type: 'WORK' as const,
    projectId: '',
    hours: 8
  });

  if (!isOpen) return null;

  const addEntry = () => {
    setEntries([...entries, {
      date: new Date().toISOString().split('T')[0],
      hours: template.hours,
      taskName: template.taskName,
      description: template.description,
      type: template.type,
      projectId: template.projectId
    }]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof BulkEntry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const updateTemplate = (field: keyof typeof template, value: any) => {
    setTemplate({ ...template, [field]: value });
  };

  const handleSubmit = () => {
    const validEntries = entries.filter(entry => 
      entry.taskName.trim() && entry.projectId && entry.hours > 0
    );
    
    if (validEntries.length > 0) {
      onSubmit(validEntries);
      onClose();
      setEntries([{
        date: new Date().toISOString().split('T')[0],
        hours: 8,
        taskName: '',
        description: '',
        type: 'WORK',
        projectId: ''
      }]);
    }
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Bulk Time Entry</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Template Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Template (applies to new entries)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Task Name
                </label>
                <input
                  type="text"
                  value={template.taskName}
                  onChange={(e) => updateTemplate('taskName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Task name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={template.hours}
                  onChange={(e) => updateTemplate('hours', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building className="inline h-4 w-4 mr-1" />
                  Project
                </label>
                <select
                  value={template.projectId}
                  onChange={(e) => updateTemplate('projectId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Entries List */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Time Entries</h4>
              <button
                onClick={addEntry}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Entry
              </button>
            </div>

            {entries.map((entry, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Entry {index + 1}</span>
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(e) => updateEntry(index, 'date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FileText className="inline h-4 w-4 mr-1" />
                      Task Name
                    </label>
                    <input
                      type="text"
                      value={entry.taskName}
                      onChange={(e) => updateEntry(index, 'taskName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Task name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={entry.hours}
                      onChange={(e) => updateEntry(index, 'hours', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Building className="inline h-4 w-4 mr-1" />
                      Project
                    </label>
                    <select
                      value={entry.projectId}
                      onChange={(e) => updateEntry(index, 'projectId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} - {project.client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Total Entries: </span>
                <span className="text-sm text-gray-900">{entries.length}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Total Hours: </span>
                <span className="text-sm text-gray-900">{formatHours(totalHours)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Create {entries.length} Entr{entries.length === 1 ? 'y' : 'ies'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
