'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Project, RoleSeniorityLevel, Task, TaskEffortLine, TeamMemberRole } from '@/lib/mockApi';
import {
  CLARIFICATION_CONFIDENCE_MAX,
  getClarificationGroupConfidence,
  getConfidenceToneClass,
} from '@/lib/clarificationConfidence';
import { getTaskTotalHours, mockApiService } from '@/lib/mockApi';
import { cn } from '@/lib/utils';

const TASK_ROLE_LABEL: Record<TeamMemberRole, string> = {
  dev: 'Dev',
  qa: 'QA',
  pm: 'PM',
  designer: 'Designer',
  tester: 'Tester',
  ba: 'BA',
};

const SENIORITY_LABEL: Record<RoleSeniorityLevel, string> = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  lead: 'Lead',
};

const EFFORT_ROLE_OPTIONS: { value: TeamMemberRole; label: string }[] = [
  { value: 'dev', label: 'Developer' },
  { value: 'qa', label: 'Quality Assurance' },
  { value: 'pm', label: 'Project Manager' },
  { value: 'designer', label: 'UI/UX Designer' },
  { value: 'tester', label: 'QA Tester' },
  { value: 'ba', label: 'Business Analyst' },
];

const EFFORT_LEVEL_OPTIONS: { value: RoleSeniorityLevel; label: string }[] = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
];

const FEATURES_PAGE_SIZE = 7;
const TASKS_PAGE_SIZE = 8;

const DEFAULT_FEATURE_DESC_HTML =
  '<p>Describe business goals, user flow, and scope for this feature.</p>';

type ParsedTaskDescription = {
  summary: string;
  acceptance: string;
  dependencies: string;
};

const parseTaskDescription = (description: string): ParsedTaskDescription => {
  const normalized = description.replace(/\r\n/g, '\n').trim();

  if (!normalized.startsWith('Task Summary:')) {
    return { summary: normalized, acceptance: '', dependencies: '' };
  }

  const parts = normalized.split(/\n(?=Acceptance Criteria:|Dependencies:)/);
  const summary = parts[0].replace(/^Task Summary:\s*/, '').trim();

  let acceptance = '';
  let dependencies = '';

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();

    if (part.startsWith('Acceptance Criteria:')) {
      acceptance = part.replace(/^Acceptance Criteria:\s*/, '').trim();
    } else if (part.startsWith('Dependencies:')) {
      dependencies = part.replace(/^Dependencies:\s*/, '').trim();
    }
  }

  return { summary, acceptance, dependencies };
};

const composeTaskDescription = (summary: string, acceptance: string, dependencies: string) => {
  const lines = [
    `Task Summary: ${summary.trim() || '(no summary)'}`,
    acceptance.trim() ? `Acceptance Criteria: ${acceptance.trim()}` : '',
    dependencies.trim() ? `Dependencies: ${dependencies.trim()}` : '',
  ].filter(Boolean);

  return lines.join('\n');
};

const computeRiskFromTaskHours = (totalHours: number): Task['risk'] => {
  if (totalHours > 60) {
    return 'high';
  }

  if (totalHours > 30) {
    return 'medium';
  }

  return 'low';
};

const stripHtmlForSearch = (value: string) =>
  value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

const paginateStrings = <T,>(items: T[], page: number, pageSize: number) => {
  if (items.length === 0) {
    return {
      pagedItems: [] as T[],
      totalPages: 1,
      currentPage: 1,
      startItemNumber: 0,
      endItemNumber: 0,
      totalItems: 0,
    };
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    pagedItems: items.slice(startIndex, endIndex),
    totalPages,
    currentPage,
    startItemNumber: startIndex + 1,
    endItemNumber: Math.min(endIndex, items.length),
    totalItems: items.length,
  };
};

const TinyMCEEditor = dynamic(() => import('@tinymce/tinymce-react').then((module) => module.Editor), {
  ssr: false,
});

interface FeatureBreakdownProps {
  project: Project;
  selectedFeature: string | null;
  onSelectedFeatureChange: (featureId: string | null) => void;
  onAnalyze: () => Promise<void>;
  onBackToDashboard: () => void;
  onProjectRefresh?: () => void | Promise<void>;
}

export function FeatureBreakdown({
  project,
  selectedFeature,
  onSelectedFeatureChange,
  onAnalyze,
  onBackToDashboard,
  onProjectRefresh,
}: FeatureBreakdownProps) {
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState(DEFAULT_FEATURE_DESC_HTML);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskEffortLines, setNewTaskEffortLines] = useState<TaskEffortLine[]>([
    { id: 'nt-effort-1', role: 'dev', seniority: 'mid', hours: 8 },
  ]);
  const newTaskEffortIdRef = useRef(1);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAcceptance, setNewTaskAcceptance] = useState('');
  const [newTaskDependencies, setNewTaskDependencies] = useState('');
  const [newTaskFeatureId, setNewTaskFeatureId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [featureDialogMode, setFeatureDialogMode] = useState<'create' | 'edit'>('create');
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskDialogMode, setTaskDialogMode] = useState<'create' | 'edit'>('create');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [featureSearch, setFeatureSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [featurePage, setFeaturePage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);

  const filteredFeatures = useMemo(() => {
    const normalized = featureSearch.trim().toLowerCase();

    if (!normalized) {
      return project.features;
    }

    return project.features.filter((f) => {
      const matchesName = f.name.toLowerCase().includes(normalized);
      const matchesDesc = stripHtmlForSearch(f.description).includes(normalized);

      return matchesName || matchesDesc;
    });
  }, [project.features, featureSearch]);

  const selectedIdBase = selectedFeature ?? project.features[0]?.id ?? null;

  const selectedId = useMemo(() => {
    if (filteredFeatures.length === 0) {
      return null;
    }

    if (selectedIdBase && filteredFeatures.some((f) => f.id === selectedIdBase)) {
      return selectedIdBase;
    }

    return filteredFeatures[0]?.id ?? null;
  }, [filteredFeatures, selectedIdBase]);

  const selectedFeat = useMemo(
    () => (selectedId ? project.features.find((f) => f.id === selectedId) : undefined),
    [project.features, selectedId]
  );

  const featurePagination = useMemo(
    () => paginateStrings(filteredFeatures, featurePage, FEATURES_PAGE_SIZE),
    [filteredFeatures, featurePage]
  );

  const filteredTasks = useMemo(() => {
    const tasks = selectedFeat?.tasks ?? [];
    const normalized = taskSearch.trim().toLowerCase();

    if (!normalized) {
      return tasks;
    }

    return tasks.filter((task: Task) => {
      const haystack = [
        task.name,
        task.description,
        task.priority,
        task.risk,
        ...task.effortLines.flatMap((line) => [line.role, line.seniority, String(line.hours)]),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [selectedFeat?.tasks, taskSearch]);

  const taskPagination = useMemo(
    () => paginateStrings(filteredTasks, taskPage, TASKS_PAGE_SIZE),
    [filteredTasks, taskPage]
  );

  const featureClarificationConfidenceById = useMemo(() => {
    const map = new Map<string, number>();

    project.features.forEach((feature) => {
      const linked = project.clarifications.filter(
        (c) => (c.featureId || 'general') === feature.id
      );
      map.set(feature.id, getClarificationGroupConfidence(linked));
    });

    return map;
  }, [project.features, project.clarifications]);

  const selectedFeatureClarificationConfidence =
    selectedId != null
      ? featureClarificationConfidenceById.get(selectedId) ?? CLARIFICATION_CONFIDENCE_MAX
      : null;

  useEffect(() => {
    setFeaturePage(1);
  }, [featureSearch]);

  useEffect(() => {
    setTaskPage(1);
  }, [taskSearch, selectedId]);

  const isRichTextEmpty = (value: string) =>
    value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length === 0;

  const resetTaskEffortDraft = () => {
    newTaskEffortIdRef.current = 1;
    setNewTaskEffortLines([{ id: 'nt-effort-1', role: 'dev', seniority: 'mid', hours: 8 }]);
  };

  const resetFeatureDialogForm = () => {
    setFeatureDialogMode('create');
    setEditingFeatureId(null);
    setNewFeatureName('');
    setNewFeatureDesc(DEFAULT_FEATURE_DESC_HTML);
  };

  const openCreateFeatureDialog = () => {
    resetFeatureDialogForm();
    setIsFeatureDialogOpen(true);
  };

  const openEditFeatureDialog = (featureId: string, e?: MouseEvent) => {
    e?.stopPropagation();
    const feature = project.features.find((f) => f.id === featureId);
    if (!feature) {
      return;
    }

    setFeatureDialogMode('edit');
    setEditingFeatureId(feature.id);
    setNewFeatureName(feature.name);
    setNewFeatureDesc(feature.description?.trim() ? feature.description : '<p></p>');
    setIsFeatureDialogOpen(true);
  };

  const resetTaskDialogForm = () => {
    setTaskDialogMode('create');
    setEditingTaskId(null);
    setNewTaskName('');
    resetTaskEffortDraft();
    setNewTaskDesc('');
    setNewTaskAcceptance('');
    setNewTaskDependencies('');
    setNewTaskFeatureId('');
    setNewTaskPriority('medium');
  };

  const openCreateTaskDialog = () => {
    resetTaskDialogForm();
    setNewTaskFeatureId(selectedId ?? project.features[0]?.id ?? '');
    setIsTaskDialogOpen(true);
  };

  const openEditTaskDialog = (task: Task, e?: MouseEvent) => {
    e?.stopPropagation();
    const parsed = parseTaskDescription(task.description);
    setTaskDialogMode('edit');
    setEditingTaskId(task.id);
    setNewTaskFeatureId(task.featureId);
    setNewTaskName(task.name);
    setNewTaskDesc(parsed.summary);
    setNewTaskAcceptance(parsed.acceptance);
    setNewTaskDependencies(parsed.dependencies);
    setNewTaskEffortLines(
      task.effortLines.length > 0
        ? task.effortLines.map((line) => ({ ...line }))
        : [{ id: 'nt-effort-1', role: 'dev', seniority: 'mid', hours: 8 }]
    );
    newTaskEffortIdRef.current = task.effortLines.length + 1;
    setNewTaskPriority(task.priority);
    setIsTaskDialogOpen(true);
  };

  const handleSaveFeature = async () => {
    if (!newFeatureName.trim() || isRichTextEmpty(newFeatureDesc)) {
      return;
    }

    setLoading(true);

    try {
      if (featureDialogMode === 'edit' && editingFeatureId) {
        await mockApiService.updateFeature(project.id, editingFeatureId, {
          name: newFeatureName.trim(),
          description: newFeatureDesc,
        });
        toast.success('Feature updated');
      } else {
        await mockApiService.addFeature(project.id, newFeatureName.trim(), newFeatureDesc);
        toast.success('Feature created');
      }

      setIsFeatureDialogOpen(false);
      resetFeatureDialogForm();
      await onProjectRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    setLoading(true);

    try {
      await mockApiService.deleteFeature(project.id, featureId);
      await onProjectRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  const handleAddTaskEffortLine = () => {
    newTaskEffortIdRef.current += 1;

    setNewTaskEffortLines((prev) => [
      ...prev,
      {
        id: `nt-effort-${newTaskEffortIdRef.current}`,
        role: 'dev',
        seniority: 'mid',
        hours: 0,
      },
    ]);
  };

  const handleRemoveTaskEffortLine = (lineId: string) => {
    setNewTaskEffortLines((prev) => {
      if (prev.length <= 1) {
        return prev;
      }

      return prev.filter((line) => line.id !== lineId);
    });
  };

  const handleUpdateTaskEffortLine = (
    lineId: string,
    patch: Partial<Pick<TaskEffortLine, 'role' | 'seniority' | 'hours'>>
  ) => {
    setNewTaskEffortLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, ...patch } : line))
    );
  };

  const handleSaveTask = async () => {
    const targetFeatureId = newTaskFeatureId || selectedId || undefined;

    if (!newTaskName.trim() || !targetFeatureId) {
      return;
    }

    const positiveLines = newTaskEffortLines.filter((line) => line.hours > 0);

    if (positiveLines.length === 0) {
      toast.error('Add at least one estimate row with hours greater than 0');
      return;
    }

    const summaryForStorage = newTaskDesc.trim() || newTaskName.trim();
    const composedTaskDescription = composeTaskDescription(
      summaryForStorage,
      newTaskAcceptance,
      newTaskDependencies
    );

    const taskTotal = positiveLines.reduce((sum, line) => sum + line.hours, 0);
    const stamp = Date.now();

    const effortLines: TaskEffortLine[] = positiveLines.map((line, index) => ({
      id:
        taskDialogMode === 'edit' && editingTaskId && !line.id.startsWith('nt-effort-')
          ? line.id
          : `el-${stamp}-${index}`,
      role: line.role,
      seniority: line.seniority,
      hours: line.hours,
    }));

    setLoading(true);

    try {
      if (taskDialogMode === 'edit' && editingTaskId) {
        await mockApiService.updateTask(project.id, targetFeatureId, editingTaskId, {
          name: newTaskName.trim(),
          effortLines,
          description: composedTaskDescription,
          priority: newTaskPriority,
          risk: computeRiskFromTaskHours(taskTotal),
        });
        toast.success('Task updated');
      } else {
        await mockApiService.addTask(
          project.id,
          targetFeatureId,
          newTaskName.trim(),
          effortLines,
          composedTaskDescription,
          newTaskPriority
        );
        toast.success('Task created');
      }

      setIsTaskDialogOpen(false);
      resetTaskDialogForm();
      await onProjectRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (featureId: string | null, taskId: string) => {
    if (!featureId) {
      return;
    }

    setLoading(true);

    try {
      await mockApiService.deleteTask(project.id, featureId, taskId);
      await onProjectRefresh?.();
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

              <div className="feature-breakdown-feature-search relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  value={featureSearch}
                  onChange={(e) => setFeatureSearch(e.target.value)}
                  placeholder="Search features (name, description)"
                  className="pl-9 bg-background border-border"
                  aria-label="Search features"
                />
              </div>

              <div className="space-y-2 mb-4 min-h-32">
                {project.features.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No features yet. Create one below.</p>
                ) : featurePagination.totalItems === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No features match your search.</p>
                ) : (
                  featurePagination.pagedItems.map((feature) => (
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
                      <span
                        className={`shrink-0 text-xs font-bold tabular-nums ${
                          selectedId === feature.id
                            ? 'text-primary-foreground'
                            : getConfidenceToneClass(featureClarificationConfidenceById.get(feature.id) ?? CLARIFICATION_CONFIDENCE_MAX)
                        }`}
                        title="Clarification confidence for this feature"
                      >
                        {(featureClarificationConfidenceById.get(feature.id) ?? CLARIFICATION_CONFIDENCE_MAX)}%
                      </span>
                      <button
                        type="button"
                        onClick={(e) => openEditFeatureDialog(feature.id, e)}
                        className={`p-1 transition-colors flex-shrink-0 ${
                          selectedId === feature.id
                            ? 'hover:text-primary-foreground/80'
                            : 'hover:text-primary'
                        }`}
                        title="Edit feature"
                        aria-label="Edit feature"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeature(feature.id)}
                        className={`p-1 transition-colors flex-shrink-0 ${
                          selectedId === feature.id
                            ? 'hover:text-primary-foreground/80'
                            : 'hover:text-red-500'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  {featurePagination.totalItems === 0
                    ? project.features.length === 0
                      ? ''
                      : '0 matches'
                    : `${featurePagination.startItemNumber}-${featurePagination.endItemNumber} of ${featurePagination.totalItems}`}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setFeaturePage((p) => Math.max(1, p - 1))}
                    disabled={
                      featurePagination.totalItems === 0 || featurePagination.currentPage === 1
                    }
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 disabled:opacity-50"
                  >
                    Prev
                  </Button>
                  <span className="min-w-12 text-center text-xs">
                    {featurePagination.totalItems === 0
                      ? ''
                      : `${featurePagination.currentPage}/${featurePagination.totalPages}`}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setFeaturePage((p) => Math.min(featurePagination.totalPages, p + 1))
                    }
                    disabled={
                      featurePagination.totalItems === 0 ||
                      featurePagination.currentPage === featurePagination.totalPages
                    }
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Add Feature */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Button
                  onClick={() => openCreateFeatureDialog()}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Feature
                </Button>
              </div>
            </div>
          </div>

          {/* Tasks for Selected Feature */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-bold text-foreground mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span>
                  Tasks for{' '}
                  <span className="text-primary">
                    {selectedFeat?.name ??
                      (project.features.length === 0 ? 'No features yet' : 'No feature selected')}
                  </span>
                </span>
                {selectedFeat != null && selectedFeatureClarificationConfidence != null && (
                  <span
                    className={`text-sm font-semibold tabular-nums ${getConfidenceToneClass(selectedFeatureClarificationConfidence)}`}
                    title="Based on clarification questions for this feature"
                  >
                    Feature confidence: {selectedFeatureClarificationConfidence}%
                  </span>
                )}
              </h2>

              <div className="feature-breakdown-task-search relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Search tasks (name, role, level, hours, priority, risk)"
                  className="pl-9 bg-background border-border"
                  disabled={!selectedFeat}
                  aria-label="Search tasks"
                />
              </div>

              {/* Tasks Table */}
              <div className="mb-6 overflow-x-auto">
                {!selectedFeat ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    {project.features.length === 0
                      ? 'Add a feature to start breaking down tasks.'
                      : 'No feature selected or no matches in the feature list.'}
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Task</th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground whitespace-nowrap">
                          Clarification confidence
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                          Estimate by role / level
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Total</th>
                        <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Priority</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Risk</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground" />
                      </tr>
                    </thead>
                    <tbody>
                      {taskPagination.totalItems === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                            {selectedFeat.tasks.length === 0
                              ? 'No tasks for this feature yet.'
                              : 'No tasks match your search.'}
                          </td>
                        </tr>
                      ) : (
                        taskPagination.pagedItems.map((task) => {
                          const taskClarificationList = project.clarifications.filter(
                            (c) => c.featureId === selectedId && c.taskId === task.id
                          );
                          const taskClarificationConfidence =
                            getClarificationGroupConfidence(taskClarificationList);

                          return (
                          <tr key={task.id} className="border-b border-border hover:bg-background transition-colors">
                            <td className="py-3 px-4 text-foreground">{task.name}</td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block font-semibold tabular-nums text-sm ${getConfidenceToneClass(taskClarificationConfidence)}`}
                                title="Based on clarification questions linked to this task"
                              >
                                {taskClarificationConfidence}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              <ul className="space-y-1 text-xs text-muted-foreground">
                                {task.effortLines.map((line) => (
                                  <li key={line.id}>
                                    {TASK_ROLE_LABEL[line.role]} / {SENIORITY_LABEL[line.seniority]}:{' '}
                                    <span className="font-medium text-foreground">{line.hours}h</span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="py-3 px-4 text-center text-foreground font-medium">
                              {getTaskTotalHours(task)}h
                            </td>
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
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => openEditTaskDialog(task, e)}
                                  className="p-1.5 text-primary hover:text-primary/80 transition-colors rounded"
                                  title="Edit task"
                                  aria-label="Edit task"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(selectedId, task.id)}
                                  className="p-1.5 text-red-500 hover:text-red-700 transition-colors rounded"
                                  title="Delete task"
                                  aria-label="Delete task"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {selectedFeat && selectedFeat.tasks.length > 0 && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>
                    {taskPagination.totalItems === 0
                      ? '0 matches'
                      : `${taskPagination.startItemNumber}-${taskPagination.endItemNumber} of ${taskPagination.totalItems}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setTaskPage((p) => Math.max(1, p - 1))}
                      disabled={taskPagination.totalItems === 0 || taskPagination.currentPage === 1}
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 disabled:opacity-50"
                    >
                      Prev
                    </Button>
                    <span className="min-w-12 text-center text-xs">
                      {taskPagination.totalItems === 0
                        ? ''
                        : `${taskPagination.currentPage}/${taskPagination.totalPages}`}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setTaskPage((p) => Math.min(taskPagination.totalPages, p + 1))}
                      disabled={
                        taskPagination.totalItems === 0 ||
                        taskPagination.currentPage === taskPagination.totalPages
                      }
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 disabled:opacity-50"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Add Task */}
              <div className="space-y-4 pt-6 border-t border-border">
                <h3 className="font-semibold text-foreground">Add New Task</h3>
                <Button
                  onClick={() => {
                    setNewTaskFeatureId(selectedId ?? project.features[0]?.id ?? '');
                    resetTaskEffortDraft();
                    setIsTaskDialogOpen(true);
                  }}
                  disabled={loading || project.features.length === 0}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Task
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Dialog
          open={isFeatureDialogOpen}
          onOpenChange={(open) => {
            setIsFeatureDialogOpen(open);

            if (!open) {
              resetFeatureDialogForm();
            }
          }}
        >
          <DialogContent
            showCloseButton
            className={cn(
              'flex max-h-[90dvh] w-[calc(100vw-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl'
            )}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <DialogHeader className="shrink-0 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
                <DialogTitle>
                  {featureDialogMode === 'edit' ? 'Edit feature' : 'Create feature'}
                </DialogTitle>
                <DialogDescription>
                  {featureDialogMode === 'edit'
                    ? 'Update the feature name and rich-text description. Tasks under this feature are unchanged.'
                    : 'Use a detailed feature brief. This flow mirrors real product discovery before estimate breakdown.'}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
                <div className="space-y-6 max-w-5xl">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Feature Name</label>
                    <Input
                      type="text"
                      value={newFeatureName}
                      onChange={(e) => setNewFeatureName(e.target.value)}
                      placeholder="Ex: Real-time order tracking"
                      className="bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                  </div>

                  <div className="space-y-2" key={`feature-editor-${featureDialogMode}-${editingFeatureId ?? 'new'}`}>
                    <label className="text-sm font-medium text-foreground">Feature Description (TinyMCE)</label>
                    <TinyMCEEditor
                      value={newFeatureDesc}
                      onEditorChange={(content) => setNewFeatureDesc(content)}
                      init={{
                        height: 420,
                        menubar: 'file edit view insert format tools table help',
                        plugins: 'lists link table code help wordcount',
                        toolbar:
                          'undo redo | styles | bold italic underline | forecolor backcolor | alignleft aligncenter alignright | bullist numlist | table | link | code',
                        branding: false,
                        statusbar: true,
                        resize: false,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex-col gap-2 border-t border-border bg-background px-4 py-3 sm:flex-row sm:justify-between sm:px-6 sm:py-4">
                <Button
                  type="button"
                  onClick={() => setIsFeatureDialogOpen(false)}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveFeature}
                  disabled={loading || !newFeatureName.trim() || isRichTextEmpty(newFeatureDesc)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                >
                  {featureDialogMode === 'edit' ? 'Update feature' : 'Save feature'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isTaskDialogOpen}
          onOpenChange={(open) => {
            setIsTaskDialogOpen(open);

            if (!open) {
              resetTaskDialogForm();
            }
          }}
        >
          <DialogContent
            showCloseButton
            className={cn(
              'flex max-h-[90dvh] w-[calc(100vw-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl'
            )}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <DialogHeader className="shrink-0 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
                <DialogTitle>{taskDialogMode === 'edit' ? 'Edit task' : 'Create task'}</DialogTitle>
                <DialogDescription className="text-pretty text-sm leading-snug">
                  {taskDialogMode === 'edit'
                    ? 'Adjust scope, estimates, acceptance criteria, and dependencies. Feature assignment stays fixed while editing.'
                    : 'Capture realistic task details including scope, estimates, acceptance criteria, and dependencies.'}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
                <div className="grid max-w-full grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-6">
                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-foreground">Assign To Feature</label>
                    <select
                      value={newTaskFeatureId || selectedId || ''}
                      onChange={(e) => setNewTaskFeatureId(e.target.value)}
                      disabled={taskDialogMode === 'edit'}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {project.features.map((feature) => (
                        <option key={feature.id} value={feature.id}>
                          {feature.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-foreground">Task Name</label>
                    <Input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="Ex: Implement webhook retry logic"
                      className="bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                  </div>

                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-foreground">Task Description</label>
                    <Textarea
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Describe implementation scope and technical approach"
                      className="min-h-24 bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                  </div>

                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-foreground">Acceptance Criteria</label>
                    <Textarea
                      value={newTaskAcceptance}
                      onChange={(e) => setNewTaskAcceptance(e.target.value)}
                      placeholder="List measurable acceptance criteria"
                      className="min-h-24 bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                  </div>

                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-foreground">Dependencies</label>
                    <Input
                      type="text"
                      value={newTaskDependencies}
                      onChange={(e) => setNewTaskDependencies(e.target.value)}
                      placeholder="Ex: Depends on API auth middleware rollout"
                      className="bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                  </div>

                  <div className="min-w-0 space-y-3 xl:col-span-2 rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Effort estimate (per task)</label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add one row per role and seniority. Only rows with hours &gt; 0 are saved.
                      </p>
                    </div>
                    <ul className="max-h-[min(50vh,22rem)] space-y-3 overflow-y-auto overflow-x-hidden pr-1 sm:max-h-none">
                      {newTaskEffortLines.map((line, idx) => (
                        <li
                          key={line.id}
                          className="flex min-w-0 flex-col gap-3 rounded-md border border-border bg-background p-3 sm:flex-row sm:flex-wrap sm:items-end"
                        >
                          <span className="text-xs text-muted-foreground sm:w-6 sm:flex-shrink-0 sm:pt-2">{idx + 1}.</span>
                          <div className="min-w-0 flex-1 basis-[8rem] sm:min-w-[7rem]">
                            <label className="block text-xs font-medium text-foreground mb-1">Role</label>
                            <select
                              value={line.role}
                              onChange={(e) =>
                                handleUpdateTaskEffortLine(line.id, {
                                  role: e.target.value as TeamMemberRole,
                                })
                              }
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              {EFFORT_ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="min-w-0 flex-1 basis-[8rem] sm:min-w-[7rem]">
                            <label className="block text-xs font-medium text-foreground mb-1">Level</label>
                            <select
                              value={line.seniority}
                              onChange={(e) =>
                                handleUpdateTaskEffortLine(line.id, {
                                  seniority: e.target.value as RoleSeniorityLevel,
                                })
                              }
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              {EFFORT_LEVEL_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-full shrink-0 sm:w-20">
                            <label className="block text-xs font-medium text-foreground mb-1">Hours</label>
                            <Input
                              type="number"
                              min={0}
                              value={line.hours}
                              onChange={(e) => {
                                const v = Number.parseInt(e.target.value, 10);
                                handleUpdateTaskEffortLine(line.id, {
                                  hours: Number.isNaN(v) ? 0 : Math.max(0, v),
                                });
                              }}
                              className="bg-background border-border text-foreground"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTaskEffortLine(line.id)}
                            disabled={newTaskEffortLines.length <= 1}
                            className="h-9 w-9 shrink-0 self-end text-destructive hover:text-destructive hover:bg-destructive/10 sm:self-auto"
                            aria-label="Remove estimate row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTaskEffortLine}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add estimate row
                    </Button>
                  </div>

                  <div className="min-w-0 space-y-2 xl:col-span-2">
                    <label className="text-sm font-medium text-foreground">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full max-w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-background px-4 py-3 sm:flex-row sm:justify-between sm:px-6 sm:py-4">
                <Button
                  type="button"
                  onClick={() => setIsTaskDialogOpen(false)}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveTask}
                  disabled={loading || !newTaskName.trim() || project.features.length === 0}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                >
                  {taskDialogMode === 'edit' ? 'Update task' : 'Save task'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
