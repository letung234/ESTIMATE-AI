'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCheck, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Project } from '@/lib/mockApi';

interface DocumentPreviewProps {
  project: Project;
  onBackToDashboard: () => void;
  onConfirm: () => Promise<void>;
}

const ITEMS_PER_PAGE = 6;

export function DocumentPreview({ project, onBackToDashboard, onConfirm }: DocumentPreviewProps) {
  const mergeUnique = (...lists: string[][]) => Array.from(new Set(lists.flat().filter(Boolean)));

  const commonRichContent = {
    features: [
      'Multi-factor Authentication',
      'Passwordless Login',
      'Account Activity Feed',
      'Granular Role Permissions',
      'Template-based Workflow Builder',
      'Bulk Data Import',
      'Bulk Data Export',
      'Advanced Search Filters',
      'Saved Search Presets',
      'Custom Dashboard Widgets',
      'Notification Preferences Center',
      'Dark/Light Theme Switch',
      'Interactive Data Charts',
      'Scheduled Report Delivery',
      'Webhook Event Subscriptions',
      'Third-party OAuth Integration',
      'Public/Private Sharing Controls',
      'In-app Guided Onboarding',
      'Contextual Help Tooltips',
      'Multi-language UI Support',
      'Audit Trail Explorer',
      'Tenant-level Configuration',
      'Feature Flag Management',
      'API Key Management Console',
      'Attachment Version History',
      'Smart Recommendation Engine',
      'Offline Data Sync',
      'Conflict Resolution Workflow',
      'Rate Usage Analytics',
      'Automated Health Checks',
    ],
    requirements: [
      '99.9% service availability target',
      'P95 API latency under 300ms',
      'End-to-end encryption in transit',
      'Encryption for sensitive fields at rest',
      'SOC 2 aligned controls',
      'PII masking in logs',
      'Automated vulnerability scanning',
      'Container image security checks',
      'Blue-green deployment strategy',
      'Canary release support',
      'Automated rollback on SLO breach',
      'Comprehensive API documentation',
      'OpenAPI schema versioning',
      'Idempotent retry-safe endpoints',
      'Cross-browser compatibility matrix',
      'Mobile-first responsive breakpoints',
      'Keyboard navigation support',
      'Screen reader semantic landmarks',
      'Data retention policy enforcement',
      'Configurable user session timeout',
      'Immutable audit logs',
      'Near real-time alerting pipeline',
      'Synthetic monitoring coverage',
      'Feature usage telemetry',
      'Batch job SLA monitoring',
      'Backup restore tested quarterly',
      'Disaster recovery RTO/RPO defined',
      'Regional data residency compliance',
      'Tenant data isolation guarantees',
      'Support handover runbook completeness',
    ],
    constraints: [
      'Hard deadline aligned with quarter close',
      'Fixed contract budget with no overrun',
      'Maximum 3 concurrent sprint streams',
      'Limited specialist availability',
      'No production downtime during migration',
      'Weekly stakeholder demo cadence',
      'Mandatory security approval gate',
      'External vendor API rate caps',
      'Strict procurement cycle for tooling',
      'Legacy module cannot be rewritten fully',
      'Backward compatibility for 2 major versions',
      'No breaking DB schema changes in phase 1',
      'Single shared staging environment',
      'Production access by approved change window',
      'Cross-region latency variability',
      'Regulatory freeze period before launch',
      'Separate sign-off from legal and compliance',
      'Limited customer beta cohort size',
      'Data migration allowed only at night',
      'On-call coverage must remain uninterrupted',
      'No increase in cloud spend above threshold',
      'Audit evidence required for each release',
      'Training completion required before rollout',
      'Parallel support for old and new flows',
      'Critical defects block release instantly',
      'Release notes required 48h before deploy',
      'Incident response drill before go-live',
      'Third-party dependency update blackout',
      'Localization sign-off before production',
      'Accessibility audit required pre-launch',
    ],
  };

  const projectTypeMockData: Record<Project['type'], { features: string[]; requirements: string[]; constraints: string[] }> = {
    New: {
      features: [
        'User Authentication',
        'Role-based Access',
        'Real-time Notifications',
        'Usage Dashboard',
        'Email Verification',
        'Session Management',
        'In-app Search',
        'Activity Timeline',
        'Admin Control Panel',
        'File Upload Support',
        'Team Workspace',
        'Public API Access',
      ],
      requirements: [
        'REST API integration',
        'Audit logging enabled',
        'Responsive design on mobile',
        'SLA monitoring',
        'SSO compatibility',
        'GDPR-compliant data handling',
        'Automated backup policy',
        'Role permission matrix',
        'Accessibility WCAG 2.1 AA',
        'Encrypted data at rest',
        'Rate limiting and throttling',
        'End-to-end observability',
      ],
      constraints: [
        'Go-live in 8 weeks',
        'Budget cap adherence',
        '2 full-stack engineers',
        'Cloud-native architecture',
        'No vendor lock-in',
        'Legacy DB compatibility',
        'Limited QA capacity',
        'Security review required',
        'Must support low bandwidth',
        'Daily deployment window 10PM',
        'Shared staging environment',
        'No downtime on release',
      ],
    },
    Maintenance: {
      features: [
        'Legacy Module Refactor',
        'Payment Flow Enhancement',
        'Admin Dashboard Update',
        'Error Tracking Improvements',
        'Database Query Optimization',
        'Report Export Stabilization',
        'Notification Rule Engine',
        'Cache Layer Tuning',
        'Customer Support Portal Fixes',
        'Search Relevance Improvements',
        'Job Queue Monitoring',
        'Form Validation Cleanup',
      ],
      requirements: [
        'Backward compatibility',
        'No downtime deployment',
        'Regression test coverage',
        'Security patching',
        'Production performance baseline',
        'Rollback playbook update',
        'Error budget thresholds',
        'Operational dashboard alerts',
        'Dependency upgrade matrix',
        'Change approval checklist',
        'Localization support retained',
        'API contract unchanged',
      ],
      constraints: [
        'Phased release plan',
        'Fixed quarterly budget',
        'Existing stack must be reused',
        'Shared QA bandwidth',
        'Limited maintenance window',
        'Critical bug queue priority',
        'No schema-breaking changes',
        'Stakeholder sign-off per phase',
        'Team split across projects',
        'Minimum training overhead',
        'Support team availability',
        'Audit trail mandatory',
      ],
    },
    Migration: {
      features: [
        'Data Migration Pipeline',
        'Authentication Provider Switch',
        'Service Decomposition',
        'Monitoring Migration',
        'Batch Reprocessing Utility',
        'Data Validation Dashboard',
        'Dual-write Compatibility Layer',
        'Read Replica Switchover',
        'Secrets Rotation Automation',
        'Event Schema Versioning',
        'Legacy API Adapter',
        'Traffic Routing Control',
      ],
      requirements: [
        'Data integrity verification',
        'Cutover rollback plan',
        'Parallel run period',
        'Compliance evidence',
        'Dry-run migration scripts',
        'Per-tenant migration reports',
        'SLO validation post-cutover',
        'Identity mapping checks',
        'Reconciliation job automation',
        'Detailed runbook documentation',
        'Disaster recovery rehearsal',
        'Cross-system traceability',
      ],
      constraints: [
        'Legacy system dependencies',
        'Strict cutover window',
        'Cross-team coordination',
        'Zero data loss tolerance',
        'Regional compliance boundaries',
        'Change freeze before launch',
        'Limited infra budget growth',
        'Dependent vendor schedule',
        'Night-only migration batches',
        'Read-heavy production traffic',
        'Business continuity guarantees',
        'No auth downtime allowed',
      ],
    },
  };

  const mockContent = useMemo(() => {
    const mockByType = projectTypeMockData[project.type];
    const featureNamesFromProject = project.features.map(f => f.name);

    return {
      features:
        project.features.length > 0
          ? mergeUnique(featureNamesFromProject, mockByType.features, commonRichContent.features)
          : mergeUnique(mockByType.features, commonRichContent.features),
      requirements: mergeUnique(mockByType.requirements, commonRichContent.requirements),
      constraints: mergeUnique(mockByType.constraints, commonRichContent.constraints),
    };
  }, [project.features, project.type]);

  const [featureSearch, setFeatureSearch] = useState('');
  const [requirementSearch, setRequirementSearch] = useState('');
  const [constraintSearch, setConstraintSearch] = useState('');
  const [featurePage, setFeaturePage] = useState(1);
  const [requirementPage, setRequirementPage] = useState(1);
  const [constraintPage, setConstraintPage] = useState(1);

  const filterItemsBySearch = (items: string[], query: string) => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return items;
    }

    return items.filter((item) => item.toLowerCase().includes(normalized));
  };

  const filteredFeatures = useMemo(
    () => filterItemsBySearch(mockContent.features, featureSearch),
    [mockContent.features, featureSearch]
  );
  const filteredRequirements = useMemo(
    () => filterItemsBySearch(mockContent.requirements, requirementSearch),
    [mockContent.requirements, requirementSearch]
  );
  const filteredConstraints = useMemo(
    () => filterItemsBySearch(mockContent.constraints, constraintSearch),
    [mockContent.constraints, constraintSearch]
  );

  useEffect(() => {
    setFeaturePage(1);
  }, [featureSearch]);

  useEffect(() => {
    setRequirementPage(1);
  }, [requirementSearch]);

  useEffect(() => {
    setConstraintPage(1);
  }, [constraintSearch]);

  const paginate = (items: string[], page: number) => {
    if (items.length === 0) {
      return {
        pagedItems: [] as string[],
        totalPages: 1,
        currentPage: 1,
        startItemNumber: 0,
        endItemNumber: 0,
        totalItems: 0,
      };
    }

    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return {
      pagedItems: items.slice(startIndex, endIndex),
      totalPages,
      currentPage,
      startItemNumber: startIndex + 1,
      endItemNumber: Math.min(endIndex, items.length),
      totalItems: items.length,
    };
  };

  const featurePagination = paginate(filteredFeatures, featurePage);
  const requirementPagination = paginate(filteredRequirements, requirementPage);
  const constraintPagination = paginate(filteredConstraints, constraintPage);

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
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                <Sparkles className="h-4 w-4" />
              </span>
              Features Identified
            </h3>
            <div className="document-preview-section-search relative mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
                placeholder="Search features..."
                className="pl-9 bg-background border-border"
                aria-label="Search features"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featurePagination.totalItems === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                  No features match your search.
                </p>
              ) : (
                featurePagination.pagedItems.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {featurePagination.totalItems === 0
                  ? '0 items'
                  : `Showing ${featurePagination.startItemNumber}-${featurePagination.endItemNumber} of ${featurePagination.totalItems}`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setFeaturePage(prev => Math.max(1, prev - 1))}
                  disabled={featurePagination.totalItems === 0 || featurePagination.currentPage === 1}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground min-w-14 text-center">
                  {featurePagination.totalItems === 0
                    ? '遯ｶ�ｿｽ'
                    : `${featurePagination.currentPage}/${featurePagination.totalPages}`}
                </span>
                <Button
                  type="button"
                  onClick={() => setFeaturePage(prev => Math.min(featurePagination.totalPages, prev + 1))}
                  disabled={
                    featurePagination.totalItems === 0 ||
                    featurePagination.currentPage === featurePagination.totalPages
                  }
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                <ClipboardCheck className="h-4 w-4" />
              </span>
              Requirements
            </h3>
            <div className="document-preview-section-search relative mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={requirementSearch}
                onChange={(e) => setRequirementSearch(e.target.value)}
                placeholder="Search requirements..."
                className="pl-9 bg-background border-border"
                aria-label="Search requirements"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requirementPagination.totalItems === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                  No requirements match your search.
                </p>
              ) : (
                requirementPagination.pagedItems.map((req) => (
                  <div
                    key={req}
                    className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className="text-foreground">{req}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {requirementPagination.totalItems === 0
                  ? '0 items'
                  : `Showing ${requirementPagination.startItemNumber}-${requirementPagination.endItemNumber} of ${requirementPagination.totalItems}`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setRequirementPage(prev => Math.max(1, prev - 1))}
                  disabled={requirementPagination.totalItems === 0 || requirementPagination.currentPage === 1}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground min-w-14 text-center">
                  {requirementPagination.totalItems === 0
                    ? '窶�'
                    : `${requirementPagination.currentPage}/${requirementPagination.totalPages}`}
                </span>
                <Button
                  type="button"
                  onClick={() => setRequirementPage(prev => Math.min(requirementPagination.totalPages, prev + 1))}
                  disabled={
                    requirementPagination.totalItems === 0 ||
                    requirementPagination.currentPage === requirementPagination.totalPages
                  }
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {/* Constraints */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">
                <AlertTriangle className="h-4 w-4" />
              </span>
              Constraints
            </h3>
            <div className="document-preview-section-search relative mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={constraintSearch}
                onChange={(e) => setConstraintSearch(e.target.value)}
                placeholder="Search constraints..."
                className="pl-9 bg-background border-border"
                aria-label="Search constraints"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {constraintPagination.totalItems === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                  No constraints match your search.
                </p>
              ) : (
                constraintPagination.pagedItems.map((constraint) => (
                  <div
                    key={constraint}
                    className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className="text-foreground">{constraint}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {constraintPagination.totalItems === 0
                  ? '0 items'
                  : `Showing ${constraintPagination.startItemNumber}-${constraintPagination.endItemNumber} of ${constraintPagination.totalItems}`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setConstraintPage(prev => Math.max(1, prev - 1))}
                  disabled={constraintPagination.totalItems === 0 || constraintPagination.currentPage === 1}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground min-w-14 text-center">
                  {constraintPagination.totalItems === 0
                    ? '—'
                    : `${constraintPagination.currentPage}/${constraintPagination.totalPages}`}
                </span>
                <Button
                  type="button"
                  onClick={() => setConstraintPage(prev => Math.min(constraintPagination.totalPages, prev + 1))}
                  disabled={
                    constraintPagination.totalItems === 0 ||
                    constraintPagination.currentPage === constraintPagination.totalPages
                  }
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
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
