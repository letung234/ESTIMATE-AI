'use client';

import { ArrowLeft, Badge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/mockApi';

interface DocumentPreviewProps {
  project: Project;
  onBackToDashboard: () => void;
  onConfirm: () => Promise<void>;
}

export function DocumentPreview({ project, onBackToDashboard, onConfirm }: DocumentPreviewProps) {
  const mockContent = {
    features: project.features.length > 0 
      ? project.features.map(f => f.name)
      : ['User Authentication', 'Payment Integration', 'Dashboard Analytics', 'Real-time Notifications'],
    requirements: ['API Rate Limiting', 'Data Encryption', 'Mobile Responsive', 'Security Compliance'],
    constraints: ['Timeline requirements', 'Budget constraints', 'Team size', 'Technology stack'],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-foreground">Document Preview</h1>
          <p className="text-muted-foreground mt-2">Review the parsed content from your document</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Project Info */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">{project.name}</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {project.type.charAt(0).toUpperCase() + project.type.slice(1)} Project
            </span>
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
              English Detected
            </span>
            {project.budget && (
              <span className="text-muted-foreground text-sm">Budget: ${project.budget.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Features */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                ✓
              </span>
              Features Identified
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockContent.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-semibold">
                    •
                  </span>
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                ⚙
              </span>
              Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockContent.requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
                    •
                  </span>
                  <span className="text-foreground">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Constraints */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">
                ⚠
              </span>
              Constraints
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockContent.constraints.map((constraint, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm font-semibold">
                    •
                  </span>
                  <span className="text-foreground">{constraint}</span>
                </div>
              ))}
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
          <Button onClick={onConfirm} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            Next: Feature Breakdown
          </Button>
        </div>
      </div>
    </div>
  );
}
