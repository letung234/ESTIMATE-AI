'use client';

import { useState } from 'react';
import { Dashboard } from './screens/Dashboard';
import { CreateProject } from './screens/CreateProject';
import { ConflictResolution } from './screens/ConflictResolution';
import { DocumentPreview } from './screens/DocumentPreview';
import { FeatureBreakdown } from './screens/FeatureBreakdown';
import { EstimationResult } from './screens/EstimationResult';
import { ClarificationList } from './screens/ClarificationList';
import { ExportApprove } from './screens/ExportApprove';
import { mockApiService, Project as MockProject, type ProjectCreationTeamContext } from '@/lib/mockApi';

export type Screen = 'dashboard' | 'create' | 'conflicts' | 'questions' | 'preview' | 'breakdown' | 'result' | 'clarification' | 'export';

export function EstimatorApp() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [screenHistory, setScreenHistory] = useState<Screen[]>(['dashboard']);
  const [currentProject, setCurrentProject] = useState<MockProject | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigateTo = (nextScreen: Screen) => {
    setScreenHistory([...screenHistory, nextScreen]);
    setScreen(nextScreen);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const newHistory = screenHistory.slice(0, -1);
      setScreenHistory(newHistory);
      setScreen(newHistory[newHistory.length - 1]);
      window.scrollTo(0, 0);
    }
  };

  const handleOpenProject = async (projectId: string) => {
    setLoading(true);
    try {
      const project = await mockApiService.getProject(projectId);
      if (project) {
        setCurrentProject(project);
        navigateTo('preview');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreate = async (
    name: string,
    type: 'New' | 'Maintenance' | 'Migration',
    budget: number,
    template: string,
    documentName: string | undefined,
    teamContext: ProjectCreationTeamContext
  ) => {
    setLoading(true);
    try {
      const newProject = await mockApiService.createProject(
        name,
        type,
        budget,
        template,
        documentName,
        teamContext
      );
      setCurrentProject(newProject);
      // Navigate to conflicts screen instead of preview
      navigateTo('conflicts');
    } finally {
      setLoading(false);
    }
  };

  const handleConflictsResolved = (resolvedConflicts: { conflictId: string; selectedOption: string }[]) => {
    // Store resolved conflicts (could be saved to project)
    console.log('Resolved conflicts:', resolvedConflicts);
    navigateTo('questions');
  };

  const handleQuestionsNext = () => {
    navigateTo('preview');
  };

  const handleDocumentConfirm = async () => {
    if (currentProject) {
      await mockApiService.calculateEstimation(currentProject.id);
      navigateTo('breakdown');
    }
  };

  const handleAnalyze = async () => {
    if (currentProject) {
      await mockApiService.calculateEstimation(currentProject.id);
      navigateTo('result');
    }
  };

  const handleClarifications = () => {
    navigateTo('clarification');
  };

  const handleExport = () => {
    navigateTo('export');
  };

  const handleBackToDashboard = () => {
    setCurrentProject(null);
    setSelectedFeature(null);
    navigateTo('dashboard');
  };

  const refreshCurrentProject = async () => {
    if (!currentProject) {
      return;
    }

    const updated = await mockApiService.getProject(currentProject.id);

    if (updated) {
      setCurrentProject({ ...updated });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-foreground">Loading...</p>
          </div>
        </div>
      )}
      {screen === 'dashboard' && (
        <Dashboard
          onNewProject={() => navigateTo('create')}
          onOpenProject={handleOpenProject}
        />
      )}
      {screen === 'create' && (
        <CreateProject
          onBackToDashboard={goBack}
          onNext={handleProjectCreate}
        />
      )}
      {screen === 'conflicts' && currentProject && (
        <ConflictResolution
          projectName={currentProject.name}
          onBack={goBack}
          onNext={handleConflictsResolved}
        />
      )}
      {screen === 'questions' && currentProject && (
        <ClarificationList
          project={currentProject}
          onNext={handleQuestionsNext}
          onBackToDashboard={goBack}
          onProjectRefresh={refreshCurrentProject}
          mode="initial"
        />
      )}
      {screen === 'preview' && currentProject && (
        <DocumentPreview
          project={currentProject}
          onBackToDashboard={goBack}
          onConfirm={handleDocumentConfirm}
        />
      )}
      {screen === 'breakdown' && currentProject && (
        <FeatureBreakdown
          project={currentProject}
          selectedFeature={selectedFeature}
          onSelectedFeatureChange={setSelectedFeature}
          onAnalyze={handleAnalyze}
          onBackToDashboard={goBack}
          onProjectRefresh={refreshCurrentProject}
        />
      )}
      {screen === 'result' && currentProject && (
        <EstimationResult
          project={currentProject}
          onClarifications={handleClarifications}
          onExport={handleExport}
          onBackToDashboard={goBack}
        />
      )}
      {screen === 'clarification' && currentProject && (
        <ClarificationList
          project={currentProject}
          onNext={handleExport}
          onBackToDashboard={goBack}
          onProjectRefresh={refreshCurrentProject}
        />
      )}
      {screen === 'export' && currentProject && (
        <ExportApprove
          project={currentProject}
          onBackToDashboard={goBack}
          onReEstimate={() => navigateTo('breakdown')}
          onAddClarifications={() => navigateTo('clarification')}
        />
      )}
    </div>
  );
}
