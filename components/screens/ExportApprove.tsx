'use client';

import { useState } from 'react';
import { ArrowLeft, Download, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/mockApi';
import { mockApiService } from '@/lib/mockApi';

interface ExportApproveProps {
  project: Project;
  onBackToDashboard: () => void;
  onReEstimate: () => void;
  onAddClarifications: () => void;
}

export function ExportApprove({
  project,
  onBackToDashboard,
  onReEstimate,
  onAddClarifications,
}: ExportApproveProps) {
  const [loading, setLoading] = useState(false);
  const estimation = project.estimation;

  if (!estimation) {
    return <div>No estimation available</div>;
  }

  const estimatedCost = estimation.totalHours * 150;

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const filename = await mockApiService.exportToPdf(project.id);
      alert(`PDF generated: ${filename}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    setLoading(true);
    try {
      const filename = await mockApiService.exportToExcel(project.id);
      alert(`Excel generated: ${filename}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await mockApiService.updateProject(project.id, { status: 'approved' });
      alert('Estimate approved!');
      onBackToDashboard();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <div className="flex gap-2">
              <button
                onClick={onAddClarifications}
                disabled={loading}
                className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors"
              >
                Ask More Questions
              </button>
              <button
                onClick={onReEstimate}
                disabled={loading}
                className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors"
              >
                Edit Breakdown
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Export & Approve</h1>
          <p className="text-muted-foreground mt-2">Review and finalize your project estimate</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Estimate Summary */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">{project.name}</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-background rounded-lg p-4">
              <p className="text-muted-foreground text-sm font-medium mb-2">Development</p>
              <p className="text-3xl font-bold text-primary">{estimation.devHours}</p>
              <p className="text-xs text-muted-foreground mt-1">hours</p>
            </div>
            <div className="bg-background rounded-lg p-4">
              <p className="text-muted-foreground text-sm font-medium mb-2">QA</p>
              <p className="text-3xl font-bold text-primary">{estimation.qaHours}</p>
              <p className="text-xs text-muted-foreground mt-1">hours</p>
            </div>
            <div className="bg-background rounded-lg p-4">
              <p className="text-muted-foreground text-sm font-medium mb-2">Project Management</p>
              <p className="text-3xl font-bold text-primary">{estimation.pmHours}</p>
              <p className="text-xs text-muted-foreground mt-1">hours</p>
            </div>
            <div className="bg-background rounded-lg p-4">
              <p className="text-muted-foreground text-sm font-medium mb-2">Total</p>
              <p className="text-3xl font-bold text-primary">{estimation.totalHours}</p>
              <p className="text-xs text-muted-foreground mt-1">hours</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-2">Project Type</p>
                <p className="text-lg font-semibold text-foreground capitalize">
                  {project.type.replace(/-/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-2">Hourly Rate</p>
                <p className="text-lg font-semibold text-foreground">$150/h</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-2">Estimated Cost</p>
                <p className="text-lg font-semibold text-primary">${estimatedCost.toLocaleString()}</p>
              </div>
              {project.budget && (
                <>
                  <div>
                    <p className="text-muted-foreground text-sm font-medium mb-2">Client Budget</p>
                    <p className="text-lg font-semibold text-foreground">${project.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm font-medium mb-2">Difference</p>
                    <p
                      className={`text-lg font-semibold ${
                        estimatedCost > project.budget ? 'text-red-500' : 'text-green-500'
                      }`}
                    >
                      {estimatedCost > project.budget ? '+' : '-'}${Math.abs(estimatedCost - project.budget).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm font-medium mb-2">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        estimatedCost > project.budget
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {estimatedCost > project.budget ? 'Over Budget' : 'Within Budget'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features & Tasks Preview */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-foreground mb-6">Included Features</h3>

          <div className="space-y-4">
            {project.features.map((feature) => {
              const featureTotalHours = feature.tasks.reduce((sum, t) => sum + t.devHours + t.qaHours + t.pmHours, 0);

              return (
                <div key={feature.id} className="p-4 bg-background rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{feature.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{feature.tasks.length} tasks</p>
                    </div>
                    <p className="font-bold text-primary">{featureTotalHours}h</p>
                  </div>

                  {feature.tasks.length > 0 && (
                    <div className="ml-4 text-sm space-y-1 text-muted-foreground">
                      {feature.tasks.map((task) => (
                        <p key={task.id}>
                          • {task.name} (Dev: {task.devHours}h, QA: {task.qaHours}h, PM: {task.pmHours}h)
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Clarifications Summary */}
        {project.clarifications.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-foreground mb-6">Clarifications Status</h3>

            <div className="space-y-3">
              {project.clarifications.map((clarification) => (
                <div key={clarification.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  {clarification.status === 'answered' ? (
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-orange-400 shrink-0" />
                  )}
                  <span
                    className={`flex-1 ${
                      clarification.status === 'answered'
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground font-medium'
                    }`}
                  >
                    {clarification.question}
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-muted text-muted-foreground">
                    {clarification.status === 'answered' ? 'Answered' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-foreground mb-6">Export Estimate</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="flex items-center gap-3 p-4 bg-white border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group disabled:opacity-50"
            >
              <FileText className="w-6 h-6 text-primary group-hover:text-primary/80" />
              <div className="text-left">
                <p className="font-semibold text-foreground">PDF Report</p>
                <p className="text-sm text-muted-foreground">Professional format with details</p>
              </div>
              <Download className="w-5 h-5 text-primary ml-auto group-hover:text-primary/80" />
            </button>

            <button
              onClick={handleDownloadExcel}
              disabled={loading}
              className="flex items-center gap-3 p-4 bg-white border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group disabled:opacity-50"
            >
              <FileText className="w-6 h-6 text-primary group-hover:text-primary/80" />
              <div className="text-left">
                <p className="font-semibold text-foreground">Excel Spreadsheet</p>
                <p className="text-sm text-muted-foreground">Editable format with breakdown</p>
              </div>
              <Download className="w-5 h-5 text-primary ml-auto group-hover:text-primary/80" />
            </button>
          </div>
        </div>

        {/* Approval Section */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-foreground mb-4">Ready to Submit?</h3>
          <p className="text-muted-foreground mb-6">
            Review all details above and approve this estimate to submit it to your team or client.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-8 border-t border-border">
          <Button
            onClick={onBackToDashboard}
            disabled={loading}
            className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Back
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Approve & Submit Estimate
          </Button>
        </div>
      </div>
    </div>
  );
}
