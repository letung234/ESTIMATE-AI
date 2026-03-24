'use client';

import { useState, useEffect } from 'react';
import { Dashboard } from './screens/Dashboard';
import { CreateProject } from './screens/CreateProject';
import { DocumentPreview } from './screens/DocumentPreview';
import { FeatureBreakdown } from './screens/FeatureBreakdown';
import { EstimationResult } from './screens/EstimationResult';
import { ClarificationList } from './screens/ClarificationList';
import { ExportApprove } from './screens/ExportApprove';
import { mockApiService, Project as MockProject } from '@/lib/mockApi';

export type Screen = 'dashboard' | 'create' | 'preview' | 'breakdown' | 'result' | 'clarification' | 'export';

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
    documentName?: string
  ) => {
    setLoading(true);
    try {
      const newProject = await mockApiService.createProject(name, type, budget, template, documentName);
      setCurrentProject(newProject);
      navigateTo('preview');
    } finally {
      setLoading(false);
    }
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
