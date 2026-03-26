'use client';

import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Plus, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Project, Clarification } from '@/lib/mockApi';
import { mockApiService } from '@/lib/mockApi';
import { getClarificationGroupConfidence, getConfidenceToneClass } from '@/lib/clarificationConfidence';

const NEW_QUESTION_WHOLE_FEATURE = '__whole_feature__';

const getClarificationScopeLabels = (
  clarification: Clarification,
  featureById: Map<string, Project['features'][number]>
) => {
  const feature = clarification.featureId ? featureById.get(clarification.featureId) : undefined;
  const featureLabel =
    feature?.name ?? clarification.featureName ?? (clarification.featureId === 'general' ? 'Project' : 'General');

  let taskLabel: string | undefined;

  if (clarification.taskId && feature) {
    const task = feature.tasks.find((t) => t.id === clarification.taskId);
    taskLabel = task?.name ?? clarification.taskName;
  } else if (clarification.taskName) {
    taskLabel = clarification.taskName;
  }

  return {
    featureLabel,
    taskLabel,
    isWholeFeature: !taskLabel,
  };
};

interface ClarificationListProps {
  project: Project;
  onNext: () => void;
  onBackToDashboard: () => void;
  /** After mock API mutates clarifications, refresh parent state so the list re-renders. */
  onProjectRefresh?: () => void | Promise<void>;
  mode?: 'initial' | 'refinement'; // initial = before estimation, refinement = after
}

export function ClarificationList({
  project,
  onNext,
  onBackToDashboard,
  onProjectRefresh,
  mode = 'refinement',
}: ClarificationListProps) {
  const [newQuestion, setNewQuestion] = useState('');
  const [newQuestionFeatureId, setNewQuestionFeatureId] = useState(
    () => project.features[0]?.id ?? ''
  );
  const [newQuestionTaskId, setNewQuestionTaskId] = useState<string>(NEW_QUESTION_WHOLE_FEATURE);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<string[]>(
    Array.from(new Set(project.clarifications.filter(c => c.status === 'pending').map(c => c.featureId || 'general')))
  );

  const featureById = useMemo(() => {
    const map = new Map<string, Project['features'][number]>();
    project.features.forEach((f) => map.set(f.id, f));

    return map;
  }, [project.features]);

  const selectedFeatureForNew = newQuestionFeatureId ? featureById.get(newQuestionFeatureId) : undefined;

  useEffect(() => {
    setNewQuestionFeatureId(project.features[0]?.id ?? '');
    setNewQuestionTaskId(NEW_QUESTION_WHOLE_FEATURE);
  }, [project.id]);

  // Group clarifications by feature
  const clarificationsByFeature = useMemo(() => {
    const grouped: Record<string, { featureName: string; clarifications: Clarification[] }> = {};

    project.clarifications.forEach(c => {
      const key = c.featureId || 'general';
      if (!grouped[key]) {
        const fromProject = key !== 'general' ? featureById.get(key)?.name : undefined;
        grouped[key] = {
          featureName: fromProject ?? c.featureName ?? (key === 'general' ? 'General Questions' : 'Feature'),
          clarifications: [],
        };
      }
      grouped[key].clarifications.push(c);
    });

    return grouped;
  }, [project.clarifications, featureById]);

  // Calculate confidence per feature
  const getFeatureConfidence = (featureId: string) => {
    const featureClarifications = project.clarifications.filter(
      c => (c.featureId || 'general') === featureId
    );
    return getClarificationGroupConfidence(featureClarifications);
  };

  // Overall confidence
  const overallConfidence = useMemo(
    () => getClarificationGroupConfidence(project.clarifications),
    [project.clarifications]
  );

  const toggleFeature = (featureId: string) => {
    setExpandedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;

    if (project.features.length > 0 && !newQuestionFeatureId) {
      toast.error('Select a feature to attach this question to');

      return;
    }

    setLoading(true);
    try {
      await mockApiService.addClarification(project.id, newQuestion.trim(), {
        featureId: newQuestionFeatureId || undefined,
        taskId:
          newQuestionTaskId !== NEW_QUESTION_WHOLE_FEATURE ? newQuestionTaskId : undefined,
      });
      setNewQuestion('');
      toast.success('Question added');
      await onProjectRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = async (clarificationId: string) => {
    const answer = answers[clarificationId];
    if (!answer?.trim()) return;

    setLoading(true);
    try {
      await mockApiService.answerClarification(project.id, clarificationId, answer);
      setAnswers((prev) => {
        const newAnswers = { ...prev };
        delete newAnswers[clarificationId];
        return newAnswers;
      });
      toast.success('Answer saved');
      await onProjectRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = project.clarifications.filter((c) => c.status === 'pending').length;
  const answeredCount = project.clarifications.filter((c) => c.status === 'answered').length;
  const highImpactPending = project.clarifications.filter(
    c => c.status === 'pending' && c.impact === 'high'
  ).length;

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-orange-600';
    return 'text-red-600';
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
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">
            {mode === 'initial' ? 'Clarification Questions' : 'Refine Estimation'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {mode === 'initial'
              ? 'Answer questions to improve estimation accuracy'
              : 'Answer additional questions to refine your estimate'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats & Confidence */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm font-medium mb-2">Overall Confidence</p>
            <p className={`text-3xl font-bold ${getConfidenceToneClass(overallConfidence)}`}>
              {overallConfidence}%
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm font-medium mb-2">Total Questions</p>
            <p className="text-3xl font-bold text-primary">{project.clarifications.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm font-medium mb-2">Pending</p>
            <p className="text-3xl font-bold text-orange-500">{pendingCount}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-sm font-medium mb-2">Answered</p>
            <p className="text-3xl font-bold text-green-500">{answeredCount}</p>
          </div>
        </div>

        {/* Warning for high impact pending */}
        {highImpactPending > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">
                {highImpactPending} high-impact question{highImpactPending > 1 ? 's' : ''} pending
              </p>
              <p className="text-sm text-red-600 mt-1">
                Answering these will significantly improve estimation accuracy.
              </p>
            </div>
          </div>
        )}

        {/* Questions grouped by Feature */}
        <div className="space-y-4 mb-8">
          {Object.entries(clarificationsByFeature).length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-foreground font-medium">No clarification questions</p>
              <p className="text-muted-foreground text-sm mt-1">You can proceed with the estimation</p>
            </div>
          ) : (
            Object.entries(clarificationsByFeature).map(([featureId, { featureName, clarifications }]) => {
              const isExpanded = expandedFeatures.includes(featureId);
              const featureConfidence = getFeatureConfidence(featureId);
              const featurePending = clarifications.filter(c => c.status === 'pending').length;

              return (
                <div key={featureId} className="bg-card border border-border rounded-lg overflow-hidden">
                  {/* Feature header */}
                  <button
                    onClick={() => toggleFeature(featureId)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {featureById.get(featureId)?.name ?? featureName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {clarifications.length} question{clarifications.length > 1 ? 's' : ''}
                          {featurePending > 0 && (
                            <span className="text-orange-600 ml-2">({featurePending} pending)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className={`font-bold ${getConfidenceToneClass(featureConfidence)}`}>
                          {featureConfidence}%
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Questions */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 space-y-4 pt-4">
                      {(() => {
                        const clarificationsByTask: Record<string, Clarification[]> = {};

                        clarifications.forEach((clarification) => {
                          const taskKey =
                            clarification.taskId ?? NEW_QUESTION_WHOLE_FEATURE;

                          if (!clarificationsByTask[taskKey]) {
                            clarificationsByTask[taskKey] = [];
                          }

                          clarificationsByTask[taskKey].push(clarification);
                        });

                        return Object.entries(clarificationsByTask).map(([taskKey, taskClarifications]) => {
                          const taskScope = getClarificationScopeLabels(taskClarifications[0], featureById);
                          const taskConfidence = getClarificationGroupConfidence(taskClarifications);
                          const taskPending = taskClarifications.filter((c) => c.status === 'pending').length;

                          const taskTitle = taskScope.isWholeFeature
                            ? 'Whole feature'
                            : `Task: ${taskScope.taskLabel}`;

                          return (
                            <div key={taskKey} className="space-y-4">
                              <div className="flex items-center justify-between border border-border bg-muted/30 rounded-lg px-3 py-2">
                                <div className="text-sm font-semibold text-foreground">
                                  {taskTitle}
                                </div>

                                <div className="flex items-center gap-3">
                                  {taskPending > 0 && (
                                    <span className="text-xs text-orange-600">
                                      ({taskPending} pending)
                                    </span>
                                  )}
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Confidence</p>
                                    <p className={`font-bold ${getConfidenceToneClass(taskConfidence)}`}>
                                      {taskConfidence}%
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                {taskClarifications.map((clarification) => {
                                  const clarificationScope = getClarificationScopeLabels(
                                    clarification,
                                    featureById
                                  );

                                  return (
                                    <div
                                      key={clarification.id}
                                      className={`p-4 rounded-lg border ${
                                        clarification.status === 'answered'
                                          ? 'border-green-200 bg-green-50/50'
                                          : 'border-orange-200 bg-orange-50/50'
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                                        <span className="rounded-md border border-border bg-muted/40 px-2 py-1 font-medium text-foreground">
                                          Feature: {clarificationScope.featureLabel}
                                        </span>
                                        <span className="rounded-md border border-border bg-background px-2 py-1 text-muted-foreground">
                                          {clarificationScope.isWholeFeature
                                            ? 'Whole feature'
                                            : `Task: ${clarificationScope.taskLabel}`}
                                        </span>
                                      </div>
                                      <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            {clarification.status === 'answered' ? (
                                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                            ) : (
                                              <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                                            )}
                                            <p className="font-medium text-foreground">{clarification.question}</p>
                                          </div>
                                        </div>
                                        <span
                                          className={`text-xs font-medium px-2 py-1 rounded ${getImpactColor(clarification.impact)}`}
                                        >
                                          {clarification.impact || 'low'} impact
                                        </span>
                                      </div>

                                      {clarification.status === 'pending' ? (
                                        <div className="ml-6 space-y-2">
                                          <Textarea
                                            value={answers[clarification.id] || ''}
                                            onChange={(e) =>
                                              setAnswers((prev) => ({
                                                ...prev,
                                                [clarification.id]: e.target.value,
                                              }))
                                            }
                                            placeholder="Type your answer..."
                                            className="bg-background border-border min-h-[60px]"
                                          />
                                          <div className="flex justify-end">
                                            <Button
                                              onClick={() => handleAnswerQuestion(clarification.id)}
                                              disabled={!answers[clarification.id]?.trim() || loading}
                                              size="sm"
                                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                                            >
                                              Save Answer
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="ml-6 p-3 bg-background rounded border border-border">
                                          <p className="text-sm text-foreground">{clarification.answer}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add Question */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-2">Add custom question</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Link each question to a feature and optionally a specific task so the team knows what it refers to.
          </p>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="clar-feature">
                  Feature
                </label>
                <Select
                  value={newQuestionFeatureId || undefined}
                  onValueChange={(value) => {
                    setNewQuestionFeatureId(value);
                    setNewQuestionTaskId(NEW_QUESTION_WHOLE_FEATURE);
                  }}
                  disabled={project.features.length === 0}
                >
                  <SelectTrigger id="clar-feature" className="w-full bg-background">
                    <SelectValue placeholder={project.features.length ? 'Select feature' : 'No features yet'} />
                  </SelectTrigger>
                  <SelectContent>
                    {project.features.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="clar-task">
                  Task (optional)
                </label>
                <Select
                  value={newQuestionTaskId}
                  onValueChange={setNewQuestionTaskId}
                  disabled={!selectedFeatureForNew || selectedFeatureForNew.tasks.length === 0}
                >
                  <SelectTrigger id="clar-task" className="w-full bg-background">
                    <SelectValue placeholder="Whole feature or pick a task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NEW_QUESTION_WHOLE_FEATURE}>Whole feature</SelectItem>
                    {(selectedFeatureForNew?.tasks ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                placeholder="Ask a clarification question..."
                className="flex-1 bg-background border-border"
              />
              <Button
                onClick={handleAddQuestion}
                disabled={
                  loading ||
                  !newQuestion.trim() ||
                  (project.features.length > 0 && !newQuestionFeatureId)
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 sm:shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
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
            onClick={onNext}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {pendingCount > 0
              ? `Continue with ${overallConfidence}% Confidence`
              : 'Continue to Next Step'}
          </Button>
        </div>

        {/* Info about skipping */}
        {pendingCount > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            You can proceed without answering all questions. Unanswered questions will reduce estimation confidence.
          </p>
        )}
      </div>
    </div>
  );
}
