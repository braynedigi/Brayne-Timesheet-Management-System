import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Calendar, CheckCircle, AlertCircle, Plus, Edit, Trash2, Users, BarChart3, Award, Clock } from 'lucide-react';
import { formatHours, getWorkDayProgress } from '@/utils/timeUtils';

interface Goal {
  id: string;
  title: string;
  targetHours: number;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  category: 'productivity' | 'learning' | 'project' | 'personal' | 'team';
  assignedTo?: string; // For team goals
  priority: 'low' | 'medium' | 'high';
}

interface GoalTrackingProps {
  timesheets: Array<{
    date: string;
    hoursWorked: string;
    type: string;
    project: { name: string };
    user: { id: string; firstName: string; lastName: string };
  }>;
  onGoalCreate: (goal: Omit<Goal, 'id'>) => void;
  onGoalUpdate: (id: string, goal: Partial<Goal>) => void;
  onGoalDelete: (id: string) => void;
}

export const GoalTracking: React.FC<GoalTrackingProps> = ({
  timesheets,
  onGoalCreate,
  onGoalUpdate,
  onGoalDelete
}) => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Complete 40 hours this week',
      targetHours: 40,
      period: 'weekly',
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      category: 'productivity',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Spend 2 hours on training',
      targetHours: 2,
      period: 'weekly',
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      category: 'learning',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Team collaboration goal',
      targetHours: 80,
      period: 'weekly',
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      category: 'team',
      priority: 'high',
      assignedTo: 'team'
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeView, setActiveView] = useState<'goals' | 'metrics' | 'comparison'>('goals');
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetHours: 8,
    period: 'daily' as const,
    category: 'productivity' as const,
    priority: 'medium' as const
  });

  // Calculate goal progress
  const calculateGoalProgress = (goal: Goal) => {
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const endDate = goal.endDate ? new Date(goal.endDate) : now;
    
    // Filter timesheets within goal period
    const relevantTimesheets = timesheets.filter(ts => {
      const tsDate = new Date(ts.date);
      return tsDate >= startDate && tsDate <= endDate;
    });

    // For team goals, include all users; for individual goals, filter by user
    const filteredTimesheets = goal.category === 'team' 
      ? relevantTimesheets 
      : relevantTimesheets.filter(ts => ts.user.id === goal.assignedTo);

    const actualHours = filteredTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hoursWorked), 0);
    const progress = Math.min((actualHours / goal.targetHours) * 100, 100);
    
    return {
      actualHours,
      progress,
      remaining: Math.max(goal.targetHours - actualHours, 0),
      isCompleted: actualHours >= goal.targetHours,
      daysRemaining: Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      entries: filteredTimesheets.length
    };
  };

  // Calculate performance metrics
  const performanceMetrics = () => {
    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.isActive).length;
    const completedGoals = goals.filter(g => calculateGoalProgress(g).isCompleted).length;
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    
    const avgProgress = goals.reduce((sum, goal) => {
      return sum + calculateGoalProgress(goal).progress;
    }, 0) / Math.max(1, goals.length);

    const categoryBreakdown = goals.reduce((acc, goal) => {
      acc[goal.category] = (acc[goal.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      completionRate,
      avgProgress,
      categoryBreakdown
    };
  };

  // Team comparison data
  const teamComparison = () => {
    const userGoals = goals.filter(g => g.category !== 'team');
    const userProgress: Record<string, { goals: number; completed: number; avgProgress: number }> = {};
    
    userGoals.forEach(goal => {
      if (goal.assignedTo) {
        if (!userProgress[goal.assignedTo]) {
          userProgress[goal.assignedTo] = { goals: 0, completed: 0, avgProgress: 0 };
        }
        userProgress[goal.assignedTo].goals += 1;
        const progress = calculateGoalProgress(goal);
        if (progress.isCompleted) {
          userProgress[goal.assignedTo].completed += 1;
        }
        userProgress[goal.assignedTo].avgProgress += progress.progress;
      }
    });

    // Calculate averages
    Object.keys(userProgress).forEach(userId => {
      const user = userProgress[userId];
      user.avgProgress = user.goals > 0 ? user.avgProgress / user.goals : 0;
    });

    return userProgress;
  };

  const handleCreateGoal = () => {
    if (newGoal.title.trim()) {
      const goal: Omit<Goal, 'id'> = {
        ...newGoal,
        startDate: new Date().toISOString().split('T')[0],
        isActive: true
      };
      onGoalCreate(goal);
      setGoals([...goals, { ...goal, id: Date.now().toString() }]);
      setNewGoal({ title: '', targetHours: 8, period: 'daily', category: 'productivity', priority: 'medium' });
      setShowCreateForm(false);
    }
  };

  const handleUpdateGoal = (id: string, updates: Partial<Goal>) => {
    onGoalUpdate(id, updates);
    setGoals(goals.map(goal => goal.id === id ? { ...goal, ...updates } : goal));
    setEditingGoal(null);
  };

  const handleDeleteGoal = (id: string) => {
    onGoalDelete(id);
    setGoals(goals.filter(goal => goal.id !== id));
  };

  const getCategoryColor = (category: Goal['category']) => {
    const colors = {
      productivity: 'bg-blue-100 text-blue-800',
      learning: 'bg-green-100 text-green-800',
      project: 'bg-purple-100 text-purple-800',
      personal: 'bg-orange-100 text-orange-800',
      team: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category];
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority];
  };

  const getPeriodLabel = (period: Goal['period']) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly'
    };
    return labels[period];
  };

  const metrics = performanceMetrics();
  const teamData = teamComparison();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Target className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Goal Tracking</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveView('goals')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeView === 'goals' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Goals
          </button>
          <button
            onClick={() => setActiveView('metrics')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeView === 'metrics' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveView('comparison')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeView === 'comparison' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Team
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Performance Metrics View */}
      {activeView === 'metrics' && (
        <div className="space-y-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Goals</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalGoals}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.completedGoals}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.completionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Avg Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.avgProgress.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Goals by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(metrics.categoryBreakdown).map(([category, count]) => (
                <div key={category} className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category as Goal['category'])}`}>
                    {category}
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-500">goals</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Trends */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Goal Progress</h3>
            <div className="space-y-4">
              {goals.slice(0, 5).map((goal) => {
                const progress = calculateGoalProgress(goal);
                return (
                  <div key={goal.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{goal.title}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                          {goal.category}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatHours(progress.actualHours)} / {formatHours(goal.targetHours)}</span>
                        <span>{progress.entries} entries</span>
                        {progress.daysRemaining > 0 && (
                          <span>{progress.daysRemaining} days left</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progress.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {progress.progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Team Comparison View */}
      {activeView === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Goal Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Goals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Progress</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(teamData).map(([userId, data]) => {
                    const user = timesheets.find(ts => ts.user.id === userId)?.user;
                    const completionRate = data.goals > 0 ? (data.completed / data.goals) * 100 : 0;
                    
                    return (
                      <tr key={userId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.goals}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{data.completed}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            completionRate >= 80 ? 'bg-green-100 text-green-800' :
                            completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {completionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${Math.min(data.avgProgress, 100)}%` }}
                              />
                            </div>
                            <span>{data.avgProgress.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team Goals */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Goals</h3>
            <div className="space-y-4">
              {goals.filter(g => g.category === 'team').map((goal) => {
                const progress = calculateGoalProgress(goal);
                return (
                  <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{goal.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                            Team Goal
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                            {goal.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingGoal(goal)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Team Progress</span>
                        <span className="text-sm text-gray-500">
                          {formatHours(progress.actualHours)} / {formatHours(goal.targetHours)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            progress.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Progress</span>
                        <p className="font-medium text-gray-900">{progress.progress.toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Remaining</span>
                        <p className="font-medium text-gray-900">{formatHours(progress.remaining)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Status</span>
                        <div className="flex items-center">
                          {progress.isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                          )}
                          <span className={`font-medium ${
                            progress.isCompleted ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {progress.isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Goals List View */}
      {activeView === 'goals' && (
        <>
          {/* Create Goal Form */}
          {showCreateForm && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Goal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Complete 40 hours this week"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Hours</label>
                  <input
                    type="number"
                    value={newGoal.targetHours}
                    onChange={(e) => setNewGoal({ ...newGoal, targetHours: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0.5"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    value={newGoal.period}
                    onChange={(e) => setNewGoal({ ...newGoal, period: e.target.value as Goal['period'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as Goal['category'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="productivity">Productivity</option>
                    <option value="learning">Learning</option>
                    <option value="project">Project</option>
                    <option value="personal">Personal</option>
                    <option value="team">Team</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as Goal['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGoal}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Create Goal
                </button>
              </div>
            </div>
          )}

          {/* Goals List */}
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = calculateGoalProgress(goal);
              
              return (
                <div key={goal.id} className="bg-white rounded-lg shadow p-6">
                  {/* Goal Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{goal.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                          {goal.category}
                        </span>
                        <span className="text-sm text-gray-500">{getPeriodLabel(goal.period)}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                          {goal.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingGoal(goal)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">
                        {formatHours(progress.actualHours)} / {formatHours(goal.targetHours)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Progress Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{progress.progress.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Remaining</span>
                      <span className="font-medium text-gray-900">{formatHours(progress.remaining)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Entries</span>
                      <span className="font-medium text-gray-900">{progress.entries}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status</span>
                      <div className="flex items-center">
                        {progress.isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                        )}
                        <span className={`font-medium ${
                          progress.isCompleted ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {progress.isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Active Status */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={goal.isActive}
                        onChange={(e) => handleUpdateGoal(goal.id, { isActive: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active Goal</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Goal</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                  <input
                    type="text"
                    value={editingGoal.title}
                    onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Hours</label>
                  <input
                    type="number"
                    value={editingGoal.targetHours}
                    onChange={(e) => setEditingGoal({ ...editingGoal, targetHours: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0.5"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    value={editingGoal.period}
                    onChange={(e) => setEditingGoal({ ...editingGoal, period: e.target.value as Goal['period'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={editingGoal.priority}
                    onChange={(e) => setEditingGoal({ ...editingGoal, priority: e.target.value as Goal['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingGoal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateGoal(editingGoal.id, editingGoal)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Update Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
