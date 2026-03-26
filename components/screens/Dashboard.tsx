'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, CheckCircle, Clock, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';
import { mockApiService, Project } from '@/lib/mockApi';

interface DashboardProps {
  onNewProject: () => void;
  onOpenProject: (projectId: string) => void;
}

export function Dashboard({ onNewProject, onOpenProject }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await mockApiService.getProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    await mockApiService.deleteProject(projectId);
    setProjects(projects.filter((p) => p.id !== projectId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'in-estimation':
      case 'analyzing':
        return 'bg-blue-100 text-blue-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const totalHours = projects.reduce((sum, p) => sum + (p.estimation?.totalHours || 0), 0);
  const avgConfidence =
    projects.reduce((sum, p) => sum + (p.estimation?.confidence || 0), 0) / (projects.length || 1);
  const activeProjects = projects.filter((p) => p.status !== 'draft' && p.status !== 'completed').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Project Estimator</h1>
              <p className="text-muted-foreground mt-2">Manage and estimate your projects with AI assistance</p>
            </div>
            <div className="flex items-center gap-4">
              <UserMenu />
              <Button onClick={onNewProject} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <Plus className="w-5 h-5" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Hours Estimated</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalHours}h</p>
              </div>
              <FileText className="w-12 h-12 text-primary/20" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Avg Confidence</p>
                <p className="text-3xl font-bold text-foreground mt-2">{Math.round(avgConfidence)}%</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500/20" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Active Projects</p>
                <p className="text-3xl font-bold text-foreground mt-2">{activeProjects}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-500/20" />
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">All Projects</h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Button onClick={onNewProject} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => onOpenProject(project.id)}>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                        <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
                          {project.type}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(project.status)}`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm mt-2">Updated on {project.updatedAt}</p>
                    </div>
                    <div className="text-right mr-4">
                      {project.estimation ? (
                        <>
                          <p className="text-2xl font-bold text-foreground">{project.estimation.totalHours}h</p>
                          <p className="text-muted-foreground text-sm">Confidence: {project.estimation.confidence}%</p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">Not estimated</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProject(project.id);
                        }}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Open project"
                      >
                        <Edit3 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
