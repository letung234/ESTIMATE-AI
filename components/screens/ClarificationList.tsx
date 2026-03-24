'use client';

import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Project } from '@/lib/mockApi';
import { mockApiService } from '@/lib/mockApi';

interface ClarificationListProps {
  project: Project;
  onNext: () => void;
  onBackToDashboard: () => void;
}

export function ClarificationList({
  project,
  onNext,
  onBackToDashboard,
}: ClarificationListProps) {
  const [newQuestion, setNewQuestion] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;
    setLoading(true);
    try {
      await mockApiService.addClarification(project.id, newQuestion);
      setNewQuestion('');
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
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = project.clarifications.filter((c) => c.status === 'pending').length;
  const answeredCount = project.clarifications.filter((c) => c.status === 'answered').length;

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
          <h1 className="text-3xl font-bold text-foreground">Clarification Questions</h1>
          <p className="text-muted-foreground mt-2">Answer key questions to refine your estimate</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
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

        {/* Questions List */}
        <div className="space-y-4 mb-8">
          {project.clarifications.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No clarification questions</p>
            </div>
          ) : (
            project.clarifications.map((clarification) => (
              <div
                key={clarification.id}
                className={`bg-card border rounded-lg p-6 ${
                  clarification.status === 'answered' ? 'border-green-200' : 'border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{clarification.question}</p>
                  </div>
                  {clarification.status === 'answered' && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                      Answered
                    </span>
                  )}
                </div>

                {clarification.status === 'pending' ? (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={answers[clarification.id] || ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [clarification.id]: e.target.value,
                        }))
                      }
                      placeholder="Your answer..."
                      className="flex-1 bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                    <Button
                      onClick={() => handleAnswerQuestion(clarification.id)}
                      disabled={!answers[clarification.id]?.trim() || loading}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Answer
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm bg-background p-3 rounded">
                    {clarification.answer}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Question */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-4">Add Custom Question</h3>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddQuestion()}
              placeholder="Ask a clarification question..."
              className="flex-1 bg-background border-border text-foreground placeholder-muted-foreground"
            />
            <Button
              onClick={handleAddQuestion}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
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
            disabled={pendingCount > 0}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {pendingCount > 0 ? `Answer ${pendingCount} Questions First` : 'Continue to Export'}
          </Button>
        </div>
      </div>
    </div>
  );
}
