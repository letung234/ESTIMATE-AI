'use client';

import { useState } from 'react';
import { ArrowLeft, AlertCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/mockApi';
import { mockApiService } from '@/lib/mockApi';

interface EstimationResultProps {
  project: Project;
  onClarifications: () => void;
  onExport: () => void;
  onBackToDashboard: () => void;
}

export function EstimationResult({
  project,
  onClarifications,
  onExport,
  onBackToDashboard,
}: EstimationResultProps) {
  const [loading, setLoading] = useState(false);
  const estimation = project.estimation;

  const handleReEstimate = async () => {
    setLoading(true);
    try {
      await mockApiService.reEstimate(project.id);
    } finally {
      setLoading(false);
    }
  };
  if (!estimation) {
    return <div className="p-8 text-center text-muted-foreground">No estimation available</div>;
  }

  const risks = Array.isArray(estimation.risks) ? estimation.risks : [];
  const estimatedCost = estimation.totalHours * 150;
  const overBudget = project.budget ? estimatedCost > project.budget : false;

  const mockSuggestions = [
    { id: '1', title: 'Prioritize core features', savings: 15 },
    { id: '2', title: 'Use existing libraries', savings: 20 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <button
              onClick={handleReEstimate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Re-estimate
            </button>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Estimation Results</h1>
          <p className="text-muted-foreground mt-2">Review your project estimation summary</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Project Summary</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-2">Dev Hours</p>
              <p className="text-3xl font-bold text-primary">{estimation.devHours}h</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-2">QA Hours</p>
              <p className="text-3xl font-bold text-primary">{estimation.qaHours}h</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-2">PM Hours</p>
              <p className="text-3xl font-bold text-primary">{estimation.pmHours}h</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-2">Total Hours</p>
              <p className="text-3xl font-bold text-primary">{estimation.totalHours}h</p>
            </div>
          </div>

          {project.budget && (
            <div className="mt-6 pt-6 border-t border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-2">Budget Status</p>
                  <p className="text-xl font-semibold text-foreground">
                    ${project.budget.toLocaleString()} / ${estimatedCost.toLocaleString()}
                  </p>
                </div>
                <div className={`text-right ${overBudget ? 'text-red-600' : 'text-green-600'}`}>
                  <p className="text-sm font-medium mb-2">
                    {overBudget ? 'Over Budget' : 'Within Budget'}
                  </p>
                  <p className="text-2xl font-bold">
                    {overBudget ? '+' : '-'}${Math.abs((estimatedCost - project.budget) / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${overBudget ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{
                      width: Math.min((estimatedCost / project.budget) * 100, 100) + '%',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Risks and Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Risks */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              Risks Detected
            </h3>

            <div className="space-y-4">
              {risks.length > 0 ? (
                risks.map((risk, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-semibold px-2 py-1 rounded bg-yellow-200 text-yellow-700">
                        MEDIUM
                      </span>
                      <p className="text-foreground font-medium">{risk}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No risks detected - project is well-defined!</p>
              )}
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-amber-500" />
              Optimization Suggestions
            </h3>

            <div className="space-y-4">
              {mockSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-foreground font-medium">{suggestion.title}</p>
                    <span className="text-sm font-bold text-amber-700 whitespace-nowrap">
                      Save {suggestion.savings}h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confidence Section */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-foreground mb-6">Estimation Confidence</h3>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground font-medium">75%</p>
              <p className="text-muted-foreground text-sm">Confidence Level</p>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '75%' }} />
            </div>
            <p className="text-muted-foreground text-sm mt-3">
              Based on available information and project complexity. Accuracy increases with detailed requirements and
              clarifications.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-8 border-t border-border">
          <Button
            onClick={onBackToDashboard}
            className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Back
          </Button>
          <Button
            onClick={onClarifications}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80"
          >
            Review Clarifications
          </Button>
          <Button onClick={onExport} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            Next: Export & Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
