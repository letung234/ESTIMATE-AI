'use client';

import { useState } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Conflict {
  id: string;
  title: string;
  description: string;
  options: {
    id: string;
    label: string;
    description: string;
    impact: string;
  }[];
  selectedOption?: string;
}

interface ConflictResolutionProps {
  projectName: string;
  onBack: () => void;
  onNext: (resolvedConflicts: { conflictId: string; selectedOption: string }[]) => void;
}

const mockConflicts: Conflict[] = [
  {
    id: 'conflict-1',
    title: 'Authentication Method',
    description: 'Multiple authentication approaches detected in requirements. Please select the preferred method.',
    options: [
      {
        id: 'jwt',
        label: 'JWT Token Based',
        description: 'Stateless authentication using JSON Web Tokens',
        impact: 'Lower server load, better for microservices',
      },
      {
        id: 'session',
        label: 'Session Based',
        description: 'Traditional server-side session management',
        impact: 'More secure for sensitive apps, requires session storage',
      },
      {
        id: 'oauth',
        label: 'OAuth 2.0 / SSO',
        description: 'Third-party authentication (Google, GitHub, etc.)',
        impact: 'Better UX, depends on external providers',
      },
    ],
  },
  {
    id: 'conflict-2',
    title: 'Database Technology',
    description: 'Project requirements mention both relational and NoSQL data patterns.',
    options: [
      {
        id: 'postgresql',
        label: 'PostgreSQL',
        description: 'Relational database with strong ACID compliance',
        impact: 'Best for structured data, complex queries',
      },
      {
        id: 'mongodb',
        label: 'MongoDB',
        description: 'Document-based NoSQL database',
        impact: 'Flexible schema, good for rapid development',
      },
      {
        id: 'hybrid',
        label: 'Hybrid Approach',
        description: 'Use both PostgreSQL and MongoDB',
        impact: 'More complex setup, best of both worlds',
      },
    ],
  },
  {
    id: 'conflict-3',
    title: 'Frontend Framework',
    description: 'UI requirements can be implemented with different approaches.',
    options: [
      {
        id: 'nextjs',
        label: 'Next.js (React)',
        description: 'Full-featured React framework with SSR/SSG',
        impact: 'Best for SEO, large ecosystem',
      },
      {
        id: 'vue',
        label: 'Nuxt.js (Vue)',
        description: 'Vue.js framework with similar capabilities',
        impact: 'Gentler learning curve, good performance',
      },
    ],
  },
];

export function ConflictResolution({ projectName, onBack, onNext }: ConflictResolutionProps) {
  const [conflicts, setConflicts] = useState<Conflict[]>(mockConflicts);
  const [expandedConflict, setExpandedConflict] = useState<string | null>(mockConflicts[0]?.id || null);

  const handleSelectOption = (conflictId: string, optionId: string) => {
    setConflicts(prev =>
      prev.map(conflict =>
        conflict.id === conflictId
          ? { ...conflict, selectedOption: optionId }
          : conflict
      )
    );
  };

  const allResolved = conflicts.every(c => c.selectedOption);
  const resolvedCount = conflicts.filter(c => c.selectedOption).length;

  const handleNext = () => {
    const resolved = conflicts
      .filter(c => c.selectedOption)
      .map(c => ({
        conflictId: c.id,
        selectedOption: c.selectedOption!,
      }));
    onNext(resolved);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">Resolve Conflicts</h1>
          <p className="text-muted-foreground mt-2">
            We found some areas that need your input for <span className="font-medium text-foreground">{projectName}</span>
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(resolvedCount / conflicts.length) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {resolvedCount} / {conflicts.length} resolved
          </span>
        </div>

        {/* Conflicts */}
        <div className="space-y-4">
          {conflicts.map((conflict, index) => {
            const isExpanded = expandedConflict === conflict.id;
            const isResolved = !!conflict.selectedOption;

            return (
              <div
                key={conflict.id}
                className={`bg-card border rounded-lg overflow-hidden transition-colors ${
                  isResolved ? 'border-green-300' : 'border-border'
                }`}
              >
                {/* Conflict Header */}
                <button
                  onClick={() => setExpandedConflict(isExpanded ? null : conflict.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isResolved ? (
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-foreground">
                        {index + 1}. {conflict.title}
                      </p>
                      {isResolved && (
                        <p className="text-sm text-green-600">
                          Selected: {conflict.options.find(o => o.id === conflict.selectedOption)?.label}
                        </p>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Conflict Options */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    <p className="text-muted-foreground text-sm py-4">{conflict.description}</p>
                    <div className="space-y-3">
                      {conflict.options.map(option => (
                        <label
                          key={option.id}
                          className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            conflict.selectedOption === option.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name={conflict.id}
                              checked={conflict.selectedOption === option.id}
                              onChange={() => handleSelectOption(conflict.id, option.id)}
                              className="mt-1 w-4 h-4 text-primary"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{option.label}</p>
                              <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                              <p className="text-xs text-primary mt-2 font-medium">Impact: {option.impact}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-8 mt-8 border-t border-border">
          <Button
            onClick={onBack}
            className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!allResolved}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {allResolved ? 'Next: Answer Questions' : `Resolve ${conflicts.length - resolvedCount} more`}
          </Button>
        </div>
      </div>
    </div>
  );
}
