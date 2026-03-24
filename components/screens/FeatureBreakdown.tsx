'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Project } from '@/lib/mockApi';
import { mockApiService } from '@/lib/mockApi';

interface FeatureBreakdownProps {
  project: Project;
  selectedFeature: string | null;
  onSelectedFeatureChange: (featureId: string | null) => void;
  onAnalyze: () => Promise<void>;
  onBackToDashboard: () => void;
}

export function FeatureBreakdown({
  project,
  selectedFeature,
  onSelectedFeatureChange,
  onAnalyze,
  onBackToDashboard,
}: FeatureBreakdownProps) {
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDev, setNewTaskDev] = useState('');
  const [newTaskQa, setNewTaskQa] = useState('');
  const [newTaskPm, setNewTaskPm] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);

  const selectedId = selectedFeature || project.features[0]?.id;
  const selectedFeat = project.features.find((f) => f.id === selectedId);
  const featureTasks = selectedFeat?.tasks || [];

  const handleAddFeature = async () => {
    if (!newFeatureName.trim()) return;
    setLoading(true);
    try {
      await mockApiService.addFeature(project.id, newFeatureName, newFeatureDesc);
      setNewFeatureName('');
      setNewFeatureDesc('');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    setLoading(true);
    try {
      await mockApiService.deleteFeature(project.id, featureId);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !newTaskDev || !selectedId) return;
    setLoading(true);
    try {
      await mockApiService.addTask(
        project.id,
        selectedId,
        newTaskName,
        parseInt(newTaskDev),
        parseInt(newTaskQa) || 0,
        parseInt(newTaskPm) || 0,
        newTaskName,
        newTaskPriority
      );
      setNewTaskName('');
      setNewTaskDev('');
      setNewTaskQa('');
      setNewTaskPm('');
      setNewTaskPriority('medium');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (featureId: string, taskId: string) => {
    setLoading(true);
    try {
      await mockApiService.deleteTask(project.id, featureId, taskId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-foreground">Feature & Task Breakdown</h1>
          <p className="text-muted-foreground mt-2">Define features and break them down into tasks</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Features List */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Features</h2>

              <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                {project.features.map((feature) => (
                  <div
                    key={feature.id}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                      selectedId === feature.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border border-border text-foreground hover:border-primary/50 hover:cursor-pointer'
                    }`}
                  >
                    <span
                      className="flex-1 cursor-pointer"
                      onClick={() => onSelectedFeatureChange(feature.id)}
                    >
                      {feature.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFeature(feature.id)}
                      className="p-1 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Feature */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Input
                  type="text"
                  value={newFeatureName}
                  onChange={(e) => setNewFeatureName(e.target.value)}
                  placeholder="Feature name"
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
                <Input
                  type="text"
                  value={newFeatureDesc}
                  onChange={(e) => setNewFeatureDesc(e.target.value)}
                  placeholder="Description"
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
                <Button
                  onClick={handleAddFeature}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Feature
                </Button>
              </div>
            </div>
          </div>

          {/* Tasks for Selected Feature */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">
                Tasks for <span className="text-primary">{selectedFeat?.name}</span>
              </h2>

              {/* Tasks Table */}
              <div className="mb-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Task</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Dev</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">QA</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">PM</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Priority</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Risk</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureTasks.map((task) => (
                      <tr key={task.id} className="border-b border-border hover:bg-background transition-colors">
                        <td className="py-3 px-4 text-foreground">{task.name}</td>
                        <td className="py-3 px-4 text-center text-foreground">{task.devHours}h</td>
                        <td className="py-3 px-4 text-center text-foreground">{task.qaHours}h</td>
                        <td className="py-3 px-4 text-center text-foreground">{task.pmHours}h</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'medium'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium ${
                              task.risk === 'high'
                                ? 'bg-red-100 text-red-700'
                                : task.risk === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {task.risk}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteTask(selectedId!, task.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Task */}
              <div className="space-y-4 pt-6 border-t border-border">
                <h3 className="font-semibold text-foreground">Add New Task</h3>
                <Input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Task name"
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
                <div className="grid grid-cols-4 gap-4">
                  <Input
                    type="number"
                    value={newTaskDev}
                    onChange={(e) => setNewTaskDev(e.target.value)}
                    placeholder="Dev hours"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                  <Input
                    type="number"
                    value={newTaskQa}
                    onChange={(e) => setNewTaskQa(e.target.value)}
                    placeholder="QA hours"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                  <Input
                    type="number"
                    value={newTaskPm}
                    onChange={(e) => setNewTaskPm(e.target.value)}
                    placeholder="PM hours"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <Button
                  onClick={handleAddTask}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-12 pt-8 border-t border-border">
          <Button
            onClick={onBackToDashboard}
            className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Back
          </Button>
          <Button onClick={onAnalyze} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            Analyze & Get Estimates
          </Button>
        </div>
      </div>
    </div>
  );
}
