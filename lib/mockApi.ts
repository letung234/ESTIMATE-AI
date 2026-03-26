// Mock API Service with realistic project estimation data

export type RoleSeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead';

export type TeamMemberRole = 'dev' | 'qa' | 'pm' | 'designer' | 'tester' | 'ba';

export interface ProjectTeamMemberInput {
  id: string;
  role: TeamMemberRole;
  seniority: RoleSeniorityLevel;
}

export interface ProjectTeamInput {
  members: ProjectTeamMemberInput[];
}

export interface ProjectCreationTeamContext {
  aiEstimationPrompt: string;
  teamInput: ProjectTeamInput;
}

export interface TaskEffortLine {
  id: string;
  role: TeamMemberRole;
  seniority: RoleSeniorityLevel;
  hours: number;
}

export interface Task {
  id: string;
  name: string;
  featureId: string;
  effortLines: TaskEffortLine[];
  risk: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  description: string;
}

export interface Feature {
  id: string;
  name: string;
  projectId: string;
  description: string;
  tasks: Task[];
  status: 'pending' | 'confirmed' | 'updated';
}

export interface Clarification {
  id: string;
  projectId: string;
  featureId?: string;
  featureName?: string;
  taskId?: string;
  taskName?: string;
  question: string;
  answer?: string;
  status: 'pending' | 'answered';
  impact: 'low' | 'medium' | 'high'; // Impact on confidence
  createdAt: string;
}

export type EstimationEffortBreakdownRow = {
  role: TeamMemberRole;
  seniority: RoleSeniorityLevel;
  hours: number;
};

export interface Project {
  id: string;
  name: string;
  type: 'New' | 'Maintenance' | 'Migration';
  status: 'draft' | 'analyzing' | 'in-estimation' | 'completed' | 'approved';
  budget: number;
  template: string;
  createdAt: string;
  updatedAt: string;
  documentName?: string;
  aiEstimationPrompt?: string;
  teamInput?: ProjectTeamInput;
  features: Feature[];
  clarifications: Clarification[];
  estimation?: {
    devHours: number;
    qaHours: number;
    pmHours: number;
    totalHours: number;
    confidence: number;
    risks: string[];
    effortByRoleLevel: EstimationEffortBreakdownRow[];
  };
}

export const getTaskTotalHours = (task: Task): number =>
  task.effortLines.reduce((sum, line) => sum + line.hours, 0);

const ROLE_SORT_ORDER: Record<TeamMemberRole, number> = {
  dev: 0,
  designer: 1,
  ba: 2,
  qa: 3,
  tester: 4,
  pm: 5,
};

const computeEffortRollupFromFeatures = (
  features: Feature[]
): Pick<NonNullable<Project['estimation']>, 'devHours' | 'qaHours' | 'pmHours' | 'totalHours' | 'effortByRoleLevel'> => {
  let devHours = 0;
  let qaHours = 0;
  let pmHours = 0;
  let totalHours = 0;
  const levelMap = new Map<string, EstimationEffortBreakdownRow>();

  for (const feature of features) {
    for (const task of feature.tasks) {
      for (const line of task.effortLines) {
        totalHours += line.hours;

        if (line.role === 'dev') {
          devHours += line.hours;
        } else if (line.role === 'qa') {
          qaHours += line.hours;
        } else if (line.role === 'pm') {
          pmHours += line.hours;
        }

        const key = `${line.role}:${line.seniority}`;
        const existing = levelMap.get(key);

        if (existing) {
          existing.hours += line.hours;
        } else {
          levelMap.set(key, { role: line.role, seniority: line.seniority, hours: line.hours });
        }
      }
    }
  }

  const orderSen = (s: RoleSeniorityLevel) =>
    s === 'junior' ? 0 : s === 'mid' ? 1 : s === 'senior' ? 2 : 3;

  const effortByRoleLevel = Array.from(levelMap.values()).sort(
    (a, b) => ROLE_SORT_ORDER[a.role] - ROLE_SORT_ORDER[b.role] || orderSen(a.seniority) - orderSen(b.seniority)
  );

  return {
    devHours,
    qaHours,
    pmHours,
    totalHours,
    effortByRoleLevel,
  };
};

export interface Notification {
  id: string;
  projectId: string;
  type: 'risk' | 'budget' | 'clarification' | 'milestone';
  message: string;
  severity: 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

const pickSeedFeatureAt = (features: Feature[], index: number): Feature | undefined =>
  features[index] ?? features[0];

const pickSeedTaskAt = (feature: Feature | undefined, taskIndex: number): Task | undefined => {
  if (!feature || feature.tasks.length === 0) {
    return undefined;
  }

  return feature.tasks[taskIndex] ?? feature.tasks[0];
};

/** Seed clarifications tied to real seeded features/tasks so scope is obvious in the UI. */
const buildSeedClarificationsForProject = (
  projectId: string,
  createdAt: string,
  features: Feature[]
): Clarification[] => {
  if (features.length === 0) {
    return [
      {
        id: `clar-seed-${projectId}-1`,
        projectId,
        featureId: 'general',
        featureName: 'Project',
        question: 'What is the primary business goal and how will you measure success for this release?',
        status: 'pending',
        impact: 'high',
        createdAt,
      },
      {
        id: `clar-seed-${projectId}-2`,
        projectId,
        featureId: 'general',
        featureName: 'Project',
        question: 'Are there must-have dates (marketing launch, contract milestone, fiscal cutoff)?',
        status: 'pending',
        impact: 'high',
        createdAt,
      },
      {
        id: `clar-seed-${projectId}-3`,
        projectId,
        featureId: 'general',
        featureName: 'Project',
        question: 'Which systems or vendors must we integrate with, and who owns those integrations?',
        status: 'pending',
        impact: 'medium',
        createdAt,
      },
      {
        id: `clar-seed-${projectId}-4`,
        projectId,
        featureId: 'general',
        featureName: 'Project',
        question: 'Is there an approved budget range or headcount cap we should align estimates to?',
        answer: 'Initial bracket approved; refinement expected after discovery',
        status: 'answered',
        impact: 'medium',
        createdAt,
      },
    ];
  }

  const f0 = pickSeedFeatureAt(features, 0);
  const f1 = pickSeedFeatureAt(features, 1);
  const t0a = pickSeedTaskAt(f0, 0);
  const t0b = pickSeedTaskAt(f0, 1);
  const t1a = pickSeedTaskAt(f1, 0);
  const t1b = pickSeedTaskAt(f1, 1);

  return [
    {
      id: `clar-seed-${projectId}-1`,
      projectId,
      featureId: f0?.id,
      featureName: f0?.name,
      taskId: t0a?.id,
      taskName: t0a?.name,
      question: 'What is the primary business goal and how will you measure success for this release?',
      status: 'pending',
      impact: 'high',
      createdAt,
    },
    {
      id: `clar-seed-${projectId}-2`,
      projectId,
      featureId: f0?.id,
      featureName: f0?.name,
      taskId: t0b?.id,
      taskName: t0b?.name,
      question: 'Are there must-have dates (marketing launch, contract milestone, fiscal cutoff)?',
      status: 'pending',
      impact: 'high',
      createdAt,
    },
    {
      id: `clar-seed-${projectId}-3`,
      projectId,
      featureId: f1?.id ?? f0?.id,
      featureName: f1?.name ?? f0?.name,
      taskId: t1a?.id,
      taskName: t1a?.name,
      question: 'Which systems or vendors must we integrate with, and who owns those integrations?',
      status: 'pending',
      impact: 'medium',
      createdAt,
    },
    {
      id: `clar-seed-${projectId}-4`,
      projectId,
      featureId: f1?.id ?? f0?.id,
      featureName: f1?.name ?? f0?.name,
      taskId: t1b?.id,
      taskName: t1b?.name,
      question: 'Is there an approved budget range or headcount cap we should align estimates to?',
      answer: 'Initial bracket approved; refinement expected after discovery',
      status: 'answered',
      impact: 'medium',
      createdAt,
    },
  ];
};

type SeedTaskSpec = {
  name: string;
  devHours: number;
  qaHours: number;
  pmHours: number;
  risk: Task['risk'];
  priority: Task['priority'];
  description: string;
};

const MOCK_SENIORITY_CYCLE: RoleSeniorityLevel[] = ['junior', 'mid', 'senior', 'lead'];

const mockHash32 = (input: string): number => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h;
};

const seniorityFromMockHash = (
  featureId: string,
  taskId: string,
  role: TeamMemberRole,
  slot: number
): RoleSeniorityLevel => {
  const key = `${featureId}|${taskId}|${role}|${slot}`;
  const h = mockHash32(key);

  return MOCK_SENIORITY_CYCLE[Math.abs(h) % MOCK_SENIORITY_CYCLE.length];
};

const mockHashMod = (parts: string[], modulus: number): number => {
  const h = mockHash32(parts.join('\x1f'));

  return Math.abs(h) % modulus;
};

const effortLinesFromSeedHours = (
  featureId: string,
  taskId: string,
  devHours: number,
  qaHours: number,
  pmHours: number
): TaskEffortLine[] => {
  const lines: TaskEffortLine[] = [];
  let slot = 0;

  if (devHours > 0) {
    const splitDev =
      devHours >= 18 && mockHashMod([featureId, taskId, 'split-dev'], 5) === 0;

    if (splitDev) {
      const first = Math.max(4, Math.round(devHours * 0.42));
      const second = devHours - first;
      lines.push({
        id: `${taskId}-dev-a`,
        role: 'dev',
        seniority: seniorityFromMockHash(featureId, taskId, 'dev', slot++),
        hours: first,
      });
      lines.push({
        id: `${taskId}-dev-b`,
        role: 'dev',
        seniority: seniorityFromMockHash(featureId, taskId, 'dev', slot++),
        hours: second,
      });
    } else {
      lines.push({
        id: `${taskId}-dev`,
        role: 'dev',
        seniority: seniorityFromMockHash(featureId, taskId, 'dev', slot++),
        hours: devHours,
      });
    }
  }

  if (qaHours > 0) {
    lines.push({
      id: `${taskId}-qa`,
      role: 'qa',
      seniority: seniorityFromMockHash(featureId, taskId, 'qa', slot++),
      hours: qaHours,
    });
  }

  if (pmHours > 0) {
    lines.push({
      id: `${taskId}-pm`,
      role: 'pm',
      seniority: seniorityFromMockHash(featureId, taskId, 'pm', slot++),
      hours: pmHours,
    });
  }

  return lines.length > 0
    ? lines
    : [
        {
          id: `${taskId}-dev`,
          role: 'dev',
          seniority: seniorityFromMockHash(featureId, taskId, 'dev', 0),
          hours: 0,
        },
      ];
};

type SeedFeatureSpec = {
  name: string;
  description: string;
  tasks: SeedTaskSpec[];
};

// Default feature & task tree for Feature Breakdown (per project type)
const FEATURE_SEED_BY_TYPE: Record<Project['type'], SeedFeatureSpec[]> = {
  New: [
    {
      name: 'Core user flows',
      description: 'MVP paths: sign-up, primary action, and account settings.',
      tasks: [
        {
          name: 'Auth API & session handling',
          devHours: 32,
          qaHours: 10,
          pmHours: 6,
          risk: 'medium',
          priority: 'high',
          description: 'JWT, refresh tokens, password reset flows',
        },
        {
          name: 'Primary UI screens',
          devHours: 40,
          qaHours: 12,
          pmHours: 8,
          risk: 'low',
          priority: 'high',
          description: 'Responsive layouts, validation, error states',
        },
        {
          name: 'Onboarding & empty states',
          devHours: 16,
          qaHours: 5,
          pmHours: 4,
          risk: 'low',
          priority: 'medium',
          description: 'First-run guidance and skeleton loaders',
        },
        {
          name: 'Deep linking & share URLs',
          devHours: 12,
          qaHours: 4,
          pmHours: 3,
          risk: 'low',
          priority: 'medium',
          description: 'Stable routes, OG metadata for shared links',
        },
      ],
    },
    {
      name: 'Integrations & notifications',
      description: 'Email, webhooks, and in-app alerts for key events.',
      tasks: [
        {
          name: 'Transactional email pipeline',
          devHours: 14,
          qaHours: 4,
          pmHours: 3,
          risk: 'low',
          priority: 'medium',
          description: 'Provider SDK, templates, bounce handling',
        },
        {
          name: 'Webhook receiver & retries',
          devHours: 22,
          qaHours: 8,
          pmHours: 5,
          risk: 'medium',
          priority: 'high',
          description: 'Signed payloads, idempotency, dead-letter queue',
        },
        {
          name: 'Push notification service',
          devHours: 18,
          qaHours: 6,
          pmHours: 4,
          risk: 'medium',
          priority: 'medium',
          description: 'Device tokens, topic fan-out, quiet hours',
        },
      ],
    },
    {
      name: 'Analytics & admin',
      description: 'Product analytics, feature flags, and internal admin tools.',
      tasks: [
        {
          name: 'Event taxonomy & instrumentation',
          devHours: 20,
          qaHours: 6,
          pmHours: 5,
          risk: 'low',
          priority: 'high',
          description: 'Canonical events, PII policy, schema registry',
        },
        {
          name: 'Admin role & audit console',
          devHours: 28,
          qaHours: 10,
          pmHours: 7,
          risk: 'medium',
          priority: 'high',
          description: 'Impersonation guardrails, export audit trail',
        },
        {
          name: 'Feature flag service integration',
          devHours: 14,
          qaHours: 5,
          pmHours: 3,
          risk: 'low',
          priority: 'medium',
          description: 'Runtime toggles, percentage rollouts',
        },
      ],
    },
    {
      name: 'Billing & entitlements',
      description: 'Plans, trials, invoices, and usage-based limits.',
      tasks: [
        {
          name: 'Stripe billing & webhooks',
          devHours: 34,
          qaHours: 12,
          pmHours: 8,
          risk: 'high',
          priority: 'high',
          description: 'Subscriptions, proration, failed payment retries',
        },
        {
          name: 'Entitlement enforcement middleware',
          devHours: 22,
          qaHours: 8,
          pmHours: 5,
          risk: 'medium',
          priority: 'high',
          description: 'Quota checks, limit UX, grace periods',
        },
        {
          name: 'Self-serve plan change UI',
          devHours: 18,
          qaHours: 6,
          pmHours: 4,
          risk: 'low',
          priority: 'medium',
          description: 'Upgrade/downgrade flows, receipts',
        },
      ],
    },
    {
      name: 'Security & compliance prep',
      description: 'Hardening, rate limits, and evidence for security review.',
      tasks: [
        {
          name: 'Rate limiting & abuse detection',
          devHours: 16,
          qaHours: 6,
          pmHours: 4,
          risk: 'medium',
          priority: 'high',
          description: 'Per-IP and per-account throttles, CAPTCHA path',
        },
        {
          name: 'Secrets & key rotation runbook',
          devHours: 10,
          qaHours: 3,
          pmHours: 6,
          risk: 'medium',
          priority: 'medium',
          description: 'KMS integration, rotation checklist, alerts',
        },
        {
          name: 'Security review fixes (SAST/DAST)',
          devHours: 24,
          qaHours: 10,
          pmHours: 6,
          risk: 'high',
          priority: 'high',
          description: 'Remediate findings, false-positive triage',
        },
      ],
    },
  ],
  Maintenance: [
    {
      name: 'Stability & performance',
      description: 'Reduce errors and improve latency on critical paths.',
      tasks: [
        {
          name: 'Hot path profiling & tuning',
          devHours: 24,
          qaHours: 8,
          pmHours: 5,
          risk: 'medium',
          priority: 'high',
          description: 'APM traces, N+1 removal, cache layers',
        },
        {
          name: 'Regression test expansion',
          devHours: 18,
          qaHours: 10,
          pmHours: 4,
          risk: 'low',
          priority: 'high',
          description: 'E2E coverage for top revenue flows',
        },
        {
          name: 'Operational runbooks',
          devHours: 8,
          qaHours: 2,
          pmHours: 6,
          risk: 'low',
          priority: 'medium',
          description: 'Alert thresholds, rollback checklist',
        },
        {
          name: 'Database index & vacuum plan',
          devHours: 14,
          qaHours: 5,
          pmHours: 3,
          risk: 'medium',
          priority: 'medium',
          description: 'Explain plans, partitions, autovacuum tuning',
        },
      ],
    },
    {
      name: 'UX & reliability fixes',
      description: 'Address support tickets and polish high-traffic screens.',
      tasks: [
        {
          name: 'Form validation & accessibility',
          devHours: 20,
          qaHours: 8,
          pmHours: 4,
          risk: 'low',
          priority: 'medium',
          description: 'WCAG fixes, keyboard navigation, field errors',
        },
        {
          name: 'Export & reporting hardening',
          devHours: 26,
          qaHours: 9,
          pmHours: 5,
          risk: 'medium',
          priority: 'high',
          description: 'Large dataset exports, timeout handling',
        },
        {
          name: 'Support tooling shortcuts',
          devHours: 12,
          qaHours: 4,
          pmHours: 3,
          risk: 'low',
          priority: 'low',
          description: 'Internal lookup views, safe bulk actions',
        },
      ],
    },
    {
      name: 'Dependency & platform upgrades',
      description: 'Framework, runtime, and library upgrades with minimal risk.',
      tasks: [
        {
          name: 'Framework minor bump & smoke suite',
          devHours: 16,
          qaHours: 8,
          pmHours: 4,
          risk: 'medium',
          priority: 'high',
          description: 'Changelog review, breaking API scan',
        },
        {
          name: 'Container base image refresh',
          devHours: 8,
          qaHours: 4,
          pmHours: 2,
          risk: 'medium',
          priority: 'medium',
          description: 'CVE scan, reproducible builds',
        },
        {
          name: 'Third-party SDK alignment',
          devHours: 20,
          qaHours: 7,
          pmHours: 5,
          risk: 'high',
          priority: 'high',
          description: 'Payment/auth vendor API version sunset',
        },
      ],
    },
    {
      name: 'Observability & SLOs',
      description: 'Dashboards, budgets, and incident readiness.',
      tasks: [
        {
          name: 'SLO definitions & burn alerts',
          devHours: 12,
          qaHours: 4,
          pmHours: 8,
          risk: 'low',
          priority: 'high',
          description: 'Error-rate and latency windows, paging policy',
        },
        {
          name: 'Log volume & cost guardrails',
          devHours: 10,
          qaHours: 3,
          pmHours: 3,
          risk: 'low',
          priority: 'medium',
          description: 'Sampling rules, retention tiers',
        },
      ],
    },
    {
      name: 'Data integrity & backfill',
      description: 'Fix historical inconsistencies and scheduled reconcilers.',
      tasks: [
        {
          name: 'Backfill job with progress reporting',
          devHours: 22,
          qaHours: 10,
          pmHours: 5,
          risk: 'high',
          priority: 'high',
          description: 'Chunked updates, idempotent keys, dry-run mode',
        },
        {
          name: 'Nightly reconciliation cron',
          devHours: 14,
          qaHours: 6,
          pmHours: 4,
          risk: 'medium',
          priority: 'medium',
          description: 'Diff reports, auto-heal vs ticket queue',
        },
      ],
    },
  ],
  Migration: [
    {
      name: 'Data migration & validation',
      description: 'ETL, reconciliation, and integrity checks before cutover.',
      tasks: [
        {
          name: 'Batch ETL jobs & checkpoints',
          devHours: 48,
          qaHours: 16,
          pmHours: 10,
          risk: 'high',
          priority: 'high',
          description: 'Resumable batches, idempotent writes, metrics',
        },
        {
          name: 'Reconciliation dashboards',
          devHours: 28,
          qaHours: 12,
          pmHours: 6,
          risk: 'medium',
          priority: 'high',
          description: 'Row counts, checksums, exception queues',
        },
        {
          name: 'Dry-run & rollback drills',
          devHours: 16,
          qaHours: 8,
          pmHours: 8,
          risk: 'medium',
          priority: 'medium',
          description: 'Practice cutover and restore procedures',
        },
        {
          name: 'Per-entity migration playbooks',
          devHours: 20,
          qaHours: 8,
          pmHours: 6,
          risk: 'medium',
          priority: 'high',
          description: 'Orders, users, inventory ordering and locks',
        },
      ],
    },
    {
      name: 'Identity & routing cutover',
      description: 'Auth provider switch, traffic shifting, and compatibility adapters.',
      tasks: [
        {
          name: 'Dual-write / strangler routing',
          devHours: 36,
          qaHours: 14,
          pmHours: 8,
          risk: 'high',
          priority: 'high',
          description: 'Feature flags, shadow reads, gradual % rollout',
        },
        {
          name: 'Legacy API adapter layer',
          devHours: 30,
          qaHours: 10,
          pmHours: 6,
          risk: 'medium',
          priority: 'high',
          description: 'Translate legacy contracts to new services',
        },
        {
          name: 'Session cookie & domain cutover plan',
          devHours: 14,
          qaHours: 6,
          pmHours: 5,
          risk: 'high',
          priority: 'high',
          description: 'Cross-subdomain SSO, forced re-login window',
        },
      ],
    },
    {
      name: 'Observability & go-live',
      description: 'Monitoring, alerts, and production readiness gates.',
      tasks: [
        {
          name: 'Cross-system tracing',
          devHours: 22,
          qaHours: 6,
          pmHours: 4,
          risk: 'medium',
          priority: 'medium',
          description: 'Correlation IDs across old and new stacks',
        },
        {
          name: 'Go-live command center checklist',
          devHours: 10,
          qaHours: 4,
          pmHours: 12,
          risk: 'low',
          priority: 'high',
          description: 'Roles, comms plan, decision log during cutover',
        },
        {
          name: 'Synthetic probes for critical journeys',
          devHours: 12,
          qaHours: 5,
          pmHours: 3,
          risk: 'low',
          priority: 'medium',
          description: 'Login, checkout, migration status page',
        },
      ],
    },
    {
      name: 'Secrets, config & env parity',
      description: 'Move secrets to vault, align env vars, and config drift checks.',
      tasks: [
        {
          name: 'Secrets vault migration',
          devHours: 18,
          qaHours: 6,
          pmHours: 5,
          risk: 'high',
          priority: 'high',
          description: 'Rotation hooks, least privilege, break-glass',
        },
        {
          name: 'Config templates per environment',
          devHours: 14,
          qaHours: 5,
          pmHours: 4,
          risk: 'medium',
          priority: 'medium',
          description: 'Diff staging vs prod, fail CI on drift',
        },
      ],
    },
    {
      name: 'Hypercare & legacy decommission',
      description: 'Post-cutover support, traffic drain, and teardown.',
      tasks: [
        {
          name: 'War room hypercare schedule',
          devHours: 8,
          qaHours: 4,
          pmHours: 16,
          risk: 'low',
          priority: 'high',
          description: 'Shift rosters, escalation matrix, status page',
        },
        {
          name: 'Traffic drain & read-only legacy mode',
          devHours: 12,
          qaHours: 6,
          pmHours: 5,
          risk: 'medium',
          priority: 'high',
          description: 'DNS/load balancer rules, cache flush',
        },
        {
          name: 'Legacy decommission & archive',
          devHours: 24,
          qaHours: 8,
          pmHours: 8,
          risk: 'medium',
          priority: 'medium',
          description: 'Final snapshot, archive buckets, handover',
        },
        {
          name: 'Knowledge transfer sessions',
          devHours: 6,
          qaHours: 2,
          pmHours: 10,
          risk: 'low',
          priority: 'medium',
          description: 'Runbooks, FAQ, support macros',
        },
      ],
    },
  ],
};

const buildSeedFeaturesForProject = (projectId: string, type: Project['type']): Feature[] => {
  const specs = FEATURE_SEED_BY_TYPE[type];

  return specs.map((spec, featureIndex) => {
    const featureId = `feat-seed-${projectId}-${featureIndex + 1}`;

    return {
      id: featureId,
      name: spec.name,
      projectId,
      description: spec.description,
      status: 'pending' as const,
      tasks: spec.tasks.map((taskSpec, taskIndex) => {
        const tid = `task-seed-${projectId}-${featureIndex + 1}-${taskIndex + 1}`;

        return {
          id: tid,
          name: taskSpec.name,
          featureId,
          risk: taskSpec.risk,
          priority: taskSpec.priority,
          description: taskSpec.description,
          effortLines: effortLinesFromSeedHours(
            featureId,
            tid,
            taskSpec.devHours,
            taskSpec.qaHours,
            taskSpec.pmHours
          ),
        };
      }),
    };
  });
};

const enrichStoredMockTasksWithVariedEfforts = (projects: Project[]): void => {
  for (const project of projects) {
    for (const feature of project.features) {
      for (const task of feature.tasks) {
        const featureId = feature.id;
        const tid = task.id;
        const rebuilt: TaskEffortLine[] = [];
        let slotIdx = 0;

        for (const line of task.effortLines) {
          const splitThisDev =
            line.role === 'dev' &&
            line.hours >= 22 &&
            mockHashMod([featureId, tid, 'enrich-split'], 4) === 0;

          if (splitThisDev) {
            const h1 = Math.max(6, Math.round(line.hours * 0.38));
            const h2 = line.hours - h1;
            rebuilt.push({
              ...line,
              id: `${tid}-dev-a`,
              seniority: seniorityFromMockHash(featureId, tid, 'dev', slotIdx),
              hours: h1,
            });
            slotIdx += 1;
            rebuilt.push({
              id: `${tid}-dev-b`,
              role: 'dev',
              seniority: seniorityFromMockHash(featureId, tid, 'dev', slotIdx),
              hours: h2,
            });
          } else {
            rebuilt.push({
              ...line,
              seniority: seniorityFromMockHash(featureId, tid, line.role, slotIdx),
            });
          }

          slotIdx += 1;
        }

        const isUiTask = /ui|mockup|screen|frontend|layout|design|catalog|grid|modal/i.test(task.name);

        if (isUiTask && mockHashMod([featureId, tid, 'designer'], 3) === 0) {
          const devLine = rebuilt.find((l) => l.role === 'dev');
          const designerHours = devLine
            ? Math.min(14, Math.max(5, Math.round(devLine.hours * 0.14)))
            : 8;

          rebuilt.push({
            id: `${tid}-designer`,
            role: 'designer',
            seniority: seniorityFromMockHash(featureId, tid, 'designer', slotIdx),
            hours: designerHours,
          });
          slotIdx += 1;
        }

        const needsBa = /integration|migration|compliance|policy|rule|engine|pipeline|ledger/i.test(task.name);

        if (needsBa && mockHashMod([featureId, tid, 'ba'], 4) === 0) {
          const subtotalHours = rebuilt.reduce((sum, line) => sum + line.hours, 0);

          rebuilt.push({
            id: `${tid}-ba`,
            role: 'ba',
            seniority: seniorityFromMockHash(featureId, tid, 'ba', slotIdx),
            hours: Math.min(16, Math.max(6, Math.round(subtotalHours * 0.08))),
          });
        }

        task.effortLines = rebuilt;
      }
    }
  }
};

const syncStoredProjectEstimationRollups = (projects: Project[]): void => {
  for (const project of projects) {
    if (!project.estimation) {
      continue;
    }

    const rollup = computeEffortRollupFromFeatures(project.features);
    Object.assign(project.estimation, {
      devHours: rollup.devHours,
      qaHours: rollup.qaHours,
      pmHours: rollup.pmHours,
      totalHours: rollup.totalHours,
      effortByRoleLevel: rollup.effortByRoleLevel,
    });
  }
};

// Mock data storage (simulating database)
const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'E-Commerce Platform Redesign',
    type: 'Maintenance',
    status: 'completed',
    budget: 50000,
    template: 'Standard',
    createdAt: '2024-02-15',
    updatedAt: '2024-03-10',
    documentName: 'requirements.pdf',
    features: [
      {
        id: 'feat-001',
        name: 'Product Catalog Redesign',
        projectId: 'proj-001',
        description: 'Modernize product listing interface',
        status: 'confirmed',
        tasks: [
          { id: 'task-001', name: 'Design new UI mockups', featureId: 'feat-001', effortLines: [{ id: 'task-001-dev', role: 'dev', seniority: 'mid', hours: 20 }, { id: 'task-001-qa', role: 'qa', seniority: 'mid', hours: 5 }, { id: 'task-001-pm', role: 'pm', seniority: 'mid', hours: 8 }], priority: 'high', risk: 'low', description: 'Create responsive designs' },
          { id: 'task-002', name: 'Frontend implementation', featureId: 'feat-001', effortLines: [{ id: 'task-002-dev', role: 'dev', seniority: 'mid', hours: 40 }, { id: 'task-002-qa', role: 'qa', seniority: 'mid', hours: 10 }, { id: 'task-002-pm', role: 'pm', seniority: 'mid', hours: 5 }], priority: 'high', risk: 'medium', description: 'React component development' },
        ],
      },
      {
        id: 'feat-002',
        name: 'Search & Filter Enhancement',
        projectId: 'proj-001',
        description: 'Advanced search capabilities',
        status: 'confirmed',
        tasks: [
          { id: 'task-003', name: 'Elasticsearch integration', featureId: 'feat-002', effortLines: [{ id: 'task-003-dev', role: 'dev', seniority: 'mid', hours: 30 }, { id: 'task-003-qa', role: 'qa', seniority: 'mid', hours: 8 }, { id: 'task-003-pm', role: 'pm', seniority: 'mid', hours: 6 }], priority: 'medium', risk: 'medium', description: 'Setup and configure search' },
          { id: 'task-077', name: 'Search synonyms & boosts', featureId: 'feat-002', effortLines: [{ id: 'task-077-dev', role: 'dev', seniority: 'mid', hours: 14 }, { id: 'task-077-qa', role: 'qa', seniority: 'mid', hours: 5 }, { id: 'task-077-pm', role: 'pm', seniority: 'mid', hours: 3 }], priority: 'medium', risk: 'low', description: 'Business-defined synonyms, field boosts' },
          { id: 'task-078', name: 'Typeahead & zero-results UX', featureId: 'feat-002', effortLines: [{ id: 'task-078-dev', role: 'dev', seniority: 'mid', hours: 12 }, { id: 'task-078-qa', role: 'qa', seniority: 'mid', hours: 4 }, { id: 'task-078-pm', role: 'pm', seniority: 'mid', hours: 2 }], priority: 'low', risk: 'low', description: 'Suggestions, popular queries fallback' },
        ],
      },
      {
        id: 'feat-013',
        name: 'Cart & checkout improvements',
        projectId: 'proj-001',
        description: 'Persistent cart, promo codes, and shipping estimates.',
        status: 'confirmed',
        tasks: [
          { id: 'task-079', name: 'Cart merge for logged-in users', featureId: 'feat-013', effortLines: [{ id: 'task-079-dev', role: 'dev', seniority: 'mid', hours: 22 }, { id: 'task-079-qa', role: 'qa', seniority: 'mid', hours: 8 }, { id: 'task-079-pm', role: 'pm', seniority: 'mid', hours: 4 }], priority: 'high', risk: 'medium', description: 'Guest to auth cart reconciliation' },
          { id: 'task-080', name: 'Promo engine integration', featureId: 'feat-013', effortLines: [{ id: 'task-080-dev', role: 'dev', seniority: 'mid', hours: 26 }, { id: 'task-080-qa', role: 'qa', seniority: 'mid', hours: 10 }, { id: 'task-080-pm', role: 'pm', seniority: 'mid', hours: 5 }], priority: 'high', risk: 'medium', description: 'Stacking rules, exclusions, audit trail' },
          { id: 'task-081', name: 'Shipping rate preview API', featureId: 'feat-013', effortLines: [{ id: 'task-081-dev', role: 'dev', seniority: 'mid', hours: 18 }, { id: 'task-081-qa', role: 'qa', seniority: 'mid', hours: 6 }, { id: 'task-081-pm', role: 'pm', seniority: 'mid', hours: 4 }], priority: 'medium', risk: 'low', description: 'Carrier quotes, address validation hook' },
        ],
      },
      {
        id: 'feat-014',
        name: 'Order lifecycle & notifications',
        projectId: 'proj-001',
        description: 'Order states, cancellation window, and buyer comms.',
        status: 'confirmed',
        tasks: [
          { id: 'task-082', name: 'Order state machine hardening', featureId: 'feat-014', effortLines: [{ id: 'task-082-dev', role: 'dev', seniority: 'mid', hours: 28 }, { id: 'task-082-qa', role: 'qa', seniority: 'mid', hours: 12 }, { id: 'task-082-pm', role: 'pm', seniority: 'mid', hours: 6 }], priority: 'high', risk: 'high', description: 'Idempotent transitions, compensation flows' },
          { id: 'task-083', name: 'Transactional email redesign', featureId: 'feat-014', effortLines: [{ id: 'task-083-dev', role: 'dev', seniority: 'mid', hours: 16 }, { id: 'task-083-qa', role: 'qa', seniority: 'mid', hours: 5 }, { id: 'task-083-pm', role: 'pm', seniority: 'mid', hours: 3 }], priority: 'medium', risk: 'low', description: 'Order placed, shipped, delivered templates' },
          { id: 'task-084', name: 'Self-service cancellation rules', featureId: 'feat-014', effortLines: [{ id: 'task-084-dev', role: 'dev', seniority: 'mid', hours: 14 }, { id: 'task-084-qa', role: 'qa', seniority: 'mid', hours: 6 }, { id: 'task-084-pm', role: 'pm', seniority: 'mid', hours: 4 }], priority: 'medium', risk: 'medium', description: 'Time window, refund integration' },
        ],
      },
      {
        id: 'feat-015',
        name: 'Merchant admin & catalog tools',
        projectId: 'proj-001',
        description: 'Bulk SKU import, price lists, and moderation.',
        status: 'pending',
        tasks: [
          { id: 'task-085', name: 'Bulk CSV import pipeline', featureId: 'feat-015', effortLines: [{ id: 'task-085-dev', role: 'dev', seniority: 'mid', hours: 32 }, { id: 'task-085-qa', role: 'qa', seniority: 'mid', hours: 12 }, { id: 'task-085-pm', role: 'pm', seniority: 'mid', hours: 7 }], priority: 'high', risk: 'high', description: 'Validation report, dry-run, partial apply' },
          { id: 'task-086', name: 'Role-scoped admin actions', featureId: 'feat-015', effortLines: [{ id: 'task-086-dev', role: 'dev', seniority: 'mid', hours: 20 }, { id: 'task-086-qa', role: 'qa', seniority: 'mid', hours: 8 }, { id: 'task-086-pm', role: 'pm', seniority: 'mid', hours: 5 }], priority: 'high', risk: 'medium', description: 'Merchant vs staff permissions' },
          { id: 'task-087', name: 'Product moderation queue', featureId: 'feat-015', effortLines: [{ id: 'task-087-dev', role: 'dev', seniority: 'mid', hours: 18 }, { id: 'task-087-qa', role: 'qa', seniority: 'mid', hours: 7 }, { id: 'task-087-pm', role: 'pm', seniority: 'mid', hours: 4 }], priority: 'medium', risk: 'low', description: 'Approve/reject, reason codes, SLA' },
        ],
      },
    ],
    clarifications: [
      {
        id: 'clar-001',
        projectId: 'proj-001',
        featureId: 'feat-001',
        featureName: 'Product Catalog Redesign',
        taskId: 'task-001',
        taskName: 'New product grid layout',
        question: 'Should old data be migrated?',
        answer: 'Yes, migrate last 2 years of products',
        status: 'answered',
        impact: 'high',
        createdAt: '2024-02-20',
      },
    ],
    estimation: {
      devHours: 90,
      qaHours: 23,
      pmHours: 19,
      totalHours: 132,
      confidence: 92,
      risks: ['Database migration risk', 'Scope creep on UI changes'],
      effortByRoleLevel: [
        { role: 'dev', seniority: 'mid', hours: 90 },
        { role: 'qa', seniority: 'mid', hours: 23 },
        { role: 'pm', seniority: 'mid', hours: 19 },
      ],
    },
  },
  {
    id: 'proj-002',
    name: 'Mobile App MVP',
    type: 'New',
    status: 'in-estimation',
    budget: 80000,
    template: 'Agile',
    createdAt: '2024-03-15',
    updatedAt: '2024-03-19',
    documentName: 'mobile-specs.pdf',
    features: [
      {
        id: 'feat-003',
        name: 'User Authentication',
        projectId: 'proj-002',
        description: 'Login, registration, password reset',
        status: 'pending',
        tasks: [
          { id: 'task-004', name: 'Backend auth API', featureId: 'feat-003', effortLines: [{ id: 'task-004-dev', role: 'dev', seniority: 'mid', hours: 25 }, { id: 'task-004-qa', role: 'qa', seniority: 'mid', hours: 8 }, { id: 'task-004-pm', role: 'pm', seniority: 'mid', hours: 4 }], priority: 'high', risk: 'low', description: 'JWT implementation' },
          { id: 'task-005', name: 'Mobile login UI', featureId: 'feat-003', effortLines: [{ id: 'task-005-dev', role: 'dev', seniority: 'mid', hours: 15 }, { id: 'task-005-qa', role: 'qa', seniority: 'mid', hours: 5 }, { id: 'task-005-pm', role: 'pm', seniority: 'mid', hours: 3 }], priority: 'high', risk: 'low', description: 'React Native screens' },
        ],
      },
      {
        id: 'feat-004',
        name: 'Feed & Social Features',
        projectId: 'proj-002',
        description: 'User feed with likes and comments',
        status: 'pending',
        tasks: [
          { id: 'task-006', name: 'Real-time notifications', featureId: 'feat-004', effortLines: [{ id: 'task-006-dev', role: 'dev', seniority: 'mid', hours: 35 }, { id: 'task-006-qa', role: 'qa', seniority: 'mid', hours: 12 }, { id: 'task-006-pm', role: 'pm', seniority: 'mid', hours: 6 }], priority: 'high', risk: 'high', description: 'WebSocket integration' },
          { id: 'task-088', name: 'Feed ranking & filters', featureId: 'feat-004', effortLines: [{ id: 'task-088-dev', role: 'dev', seniority: 'mid', hours: 24 }, { id: 'task-088-qa', role: 'qa', seniority: 'mid', hours: 8 }, { id: 'task-088-pm', role: 'pm', seniority: 'mid', hours: 5 }], priority: 'medium', risk: 'medium', description: 'Chronological vs relevance, mute keywords' },
          { id: 'task-089', name: 'Media upload & moderation', featureId: 'feat-004', effortLines: [{ id: 'task-089-dev', role: 'dev', seniority: 'mid', hours: 30 }, { id: 'task-089-qa', role: 'qa', seniority: 'mid', hours: 11 }, { id: 'task-089-pm', role: 'pm', seniority: 'mid', hours: 6 }], priority: 'high', risk: 'high', description: 'Image pipeline, virus scan, reports' },
        ],
      },
      {
        id: 'feat-021',
        name: 'User profile & presence',
        projectId: 'proj-002',
        description: 'Avatar, bio, online status, and blocking.',
        status: 'pending',
        tasks: [
          { id: 'task-090', name: 'Profile edit & avatar crop', featureId: 'feat-021', effortLines: [{ id: 'task-090-dev', role: 'dev', seniority: 'mid', hours: 18 }, { id: 'task-090-qa', role: 'qa', seniority: 'mid', hours: 6 }, { id: 'task-090-pm', role: 'pm', seniority: 'mid', hours: 3 }], priority: 'medium', risk: 'low', description: 'Image transcoding, CDN cache' },
          { id: 'task-091', name: 'Block & mute flows', featureId: 'feat-021', effortLines: [{ id: 'task-091-dev', role: 'dev', seniority: 'mid', hours: 12 }, { id: 'task-091-qa', role: 'qa', seniority: 'mid', hours: 5 }, { id: 'task-091-pm', role: 'pm', seniority: 'mid', hours: 3 }], priority: 'high', risk: 'medium', description: 'GraphQL/API enforcement, audit' },
        ],
      },
      {
        id: 'feat-022',
        name: 'Offline mode & sync',
        projectId: 'proj-002',
        description: 'Cached reads, queued writes, conflict hints.',
        status: 'pending',
        tasks: [
          { id: 'task-092', name: 'Local persistence layer', featureId: 'feat-022', effortLines: [{ id: 'task-092-dev', role: 'dev', seniority: 'mid', hours: 36 }, { id: 'task-092-qa', role: 'qa', seniority: 'mid', hours: 14 }, { id: 'task-092-pm', role: 'pm', seniority: 'mid', hours: 8 }], priority: 'high', risk: 'high', description: 'SQLite/SQLCipher, encryption at rest' },
          { id: 'task-093', name: 'Sync engine & conflict UI', featureId: 'feat-022', effortLines: [{ id: 'task-093-dev', role: 'dev', seniority: 'mid', hours: 40 }, { id: 'task-093-qa', role: 'qa', seniority: 'mid', hours: 16 }, { id: 'task-093-pm', role: 'pm', seniority: 'mid', hours: 8 }], priority: 'high', risk: 'high', description: 'Vector clocks, user-resolvable conflicts' },
          { id: 'task-094', name: 'Background fetch scheduling', featureId: 'feat-022', effortLines: [{ id: 'task-094-dev', role: 'dev', seniority: 'mid', hours: 14 }, { id: 'task-094-qa', role: 'qa', seniority: 'mid', hours: 5 }, { id: 'task-094-pm', role: 'pm', seniority: 'mid', hours: 3 }], priority: 'medium', risk: 'medium', description: 'OS limits, battery-aware backoff' },
        ],
      },
      {
        id: 'feat-023',
        name: 'App store & compliance',
        projectId: 'proj-002',
        description: 'ATT prompts, privacy manifest, crash reporting.',
        status: 'pending',
        tasks: [
          { id: 'task-095', name: 'iOS privacy manifest & ATT', featureId: 'feat-023', effortLines: [{ id: 'task-095-dev', role: 'dev', seniority: 'mid', hours: 12 }, { id: 'task-095-qa', role: 'qa', seniority: 'mid', hours: 5 }, { id: 'task-095-pm', role: 'pm', seniority: 'mid', hours: 6 }], priority: 'high', risk: 'medium', description: 'Apple review checklist, tracking disclosure' },
          { id: 'task-096', name: 'Play data safety form alignment', featureId: 'feat-023', effortLines: [{ id: 'task-096-dev', role: 'dev', seniority: 'mid', hours: 10 }, { id: 'task-096-qa', role: 'qa', seniority: 'mid', hours: 4 }, { id: 'task-096-pm', role: 'pm', seniority: 'mid', hours: 5 }], priority: 'high', risk: 'low', description: 'Data collection mapping, tester notes' },
          { id: 'task-097', name: 'Crash & ANR symbolication', featureId: 'feat-023', effortLines: [{ id: 'task-097-dev', role: 'dev', seniority: 'mid', hours: 8 }, { id: 'task-097-qa', role: 'qa', seniority: 'mid', hours: 3 }, { id: 'task-097-pm', role: 'pm', seniority: 'mid', hours: 2 }], priority: 'medium', risk: 'low', description: 'dSYM/proguard upload in CI' },
        ],
      },
    ],
    clarifications: [
      {
        id: 'clar-002',
        projectId: 'proj-002',
        featureId: 'feat-003',
        featureName: 'User Authentication',
        taskId: 'task-004',
        taskName: 'Backend auth API',
        question: 'Target iOS, Android, or both?',
        status: 'pending',
        impact: 'high',
        createdAt: '2024-03-15',
      },
      {
        id: 'clar-003',
        projectId: 'proj-002',
        featureId: 'feat-004',
        featureName: 'Feed & Social Features',
        taskId: 'task-006',
        taskName: 'Real-time notifications',
        question: 'Expected user base at launch?',
        status: 'pending',
        impact: 'medium',
        createdAt: '2024-03-16',
      },
    ],
    estimation: {
      devHours: 75,
      qaHours: 25,
      pmHours: 13,
      totalHours: 113,
      confidence: 68,
      risks: ['Unclear scope on social features', 'Real-time architecture complexity'],
      effortByRoleLevel: [
        { role: 'dev', seniority: 'mid', hours: 75 },
        { role: 'qa', seniority: 'mid', hours: 25 },
        { role: 'pm', seniority: 'mid', hours: 13 },
      ],
    },
  },
  {
    id: 'proj-003',
    name: 'Legacy System Migration',
    type: 'Migration',
    status: 'draft',
    budget: 120000,
    template: 'Enterprise',
    createdAt: '2024-03-18',
    updatedAt: '2024-03-18',
    features: buildSeedFeaturesForProject('proj-003', 'Migration'),
    clarifications: [
      {
        id: 'clar-004',
        projectId: 'proj-003',
        featureId: 'feat-seed-proj-003-2',
        featureName: 'Identity & routing cutover',
        taskId: 'task-seed-proj-003-2-2',
        taskName: 'Legacy API adapter layer',
        question: 'Which legacy modules must be included in phase 1 vs deferred to later phases?',
        status: 'pending',
        impact: 'high',
        createdAt: '2024-03-18',
      },
      {
        id: 'clar-005',
        projectId: 'proj-003',
        featureId: 'feat-seed-proj-003-3',
        featureName: 'Observability & go-live',
        taskId: 'task-seed-proj-003-3-2',
        taskName: 'Go-live command center checklist',
        question: 'What is the maximum acceptable downtime window for production cutover?',
        status: 'pending',
        impact: 'high',
        createdAt: '2024-03-18',
      },
      {
        id: 'clar-006',
        projectId: 'proj-003',
        featureId: 'feat-seed-proj-003-1',
        featureName: 'Data migration & validation',
        taskId: 'task-seed-proj-003-1-1',
        taskName: 'Batch ETL jobs & checkpoints',
        question: 'Are there retention or compliance rules that affect how historical data is handled?',
        status: 'pending',
        impact: 'medium',
        createdAt: '2024-03-17',
      },
      {
        id: 'clar-007',
        projectId: 'proj-003',
        featureId: 'feat-seed-proj-003-2',
        featureName: 'Identity & routing cutover',
        taskId: 'task-seed-proj-003-2-1',
        taskName: 'Dual-write / strangler routing',
        question: 'Should the team target a big-bang migration or a phased strangler pattern?',
        answer: 'Phased strangler; big-bang rejected by ops',
        status: 'answered',
        impact: 'medium',
        createdAt: '2024-03-16',
      },
    ],
  },
];

enrichStoredMockTasksWithVariedEfforts(mockProjects);
syncStoredProjectEstimationRollups(mockProjects);

const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    projectId: 'proj-002',
    type: 'clarification',
    message: '2 clarification questions pending answers',
    severity: 'warning',
    read: false,
    createdAt: '2024-03-19',
  },
  {
    id: 'notif-002',
    projectId: 'proj-001',
    type: 'budget',
    message: 'Project approved! Ready for execution.',
    severity: 'info',
    read: true,
    createdAt: '2024-03-10',
  },
  {
    id: 'notif-003',
    projectId: 'proj-002',
    type: 'risk',
    message: 'High-risk item detected: Real-time architecture complexity',
    severity: 'warning',
    read: false,
    createdAt: '2024-03-17',
  },
];

async function traceNetwork(operation: string, payload?: unknown): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    await fetch('/api/network-trace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operation, payload, timestamp: Date.now() }),
      cache: 'no-store',
    });
  } catch {
    // Ignore telemetry failures so the mock flow remains uninterrupted.
  }
}

// API Methods
export const mockApiService = {
  // Projects
  async getProjects(): Promise<Project[]> {
    await traceNetwork('getProjects');
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockProjects), 300);
    });
  },

  async getProject(id: string): Promise<Project | null> {
    await traceNetwork('getProject', { id });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockProjects.find((p) => p.id === id) || null);
      }, 200);
    });
  },

  async createProject(
    name: string,
    type: 'New' | 'Maintenance' | 'Migration',
    budget: number,
    template: string,
    documentName?: string,
    teamContext?: ProjectCreationTeamContext
  ): Promise<Project> {
    await traceNetwork('createProject', { name, type, budget, template, documentName, teamContext });
    return new Promise((resolve) => {
      setTimeout(() => {
        const createdAt = new Date().toISOString().split('T')[0];
        const newId = `proj-${String(mockProjects.length + 1).padStart(3, '0')}`;
        const trimmedPrompt = teamContext?.aiEstimationPrompt?.trim();
        const seededFeatures = buildSeedFeaturesForProject(newId, type);
        const newProject: Project = {
          id: newId,
          name,
          type,
          status: 'analyzing',
          budget,
          template,
          documentName,
          ...(trimmedPrompt ? { aiEstimationPrompt: trimmedPrompt } : {}),
          ...(teamContext?.teamInput ? { teamInput: teamContext.teamInput } : {}),
          createdAt,
          updatedAt: createdAt,
          features: seededFeatures,
          clarifications: buildSeedClarificationsForProject(newId, createdAt, seededFeatures),
        };
        mockProjects.push(newProject);
        enrichStoredMockTasksWithVariedEfforts([newProject]);
        resolve(newProject);
      }, 500);
    });
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    await traceNetwork('updateProject', { id, updates });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === id);
        if (project) {
          Object.assign(project, updates, { updatedAt: new Date().toISOString().split('T')[0] });
          resolve(project);
        }
      }, 300);
    });
  },

  async deleteProject(id: string): Promise<void> {
    await traceNetwork('deleteProject', { id });
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockProjects.findIndex((p) => p.id === id);
        if (index > -1) {
          mockProjects.splice(index, 1);
        }
        resolve();
      }, 300);
    });
  },

  // Features
  async addFeature(
    projectId: string,
    name: string,
    description: string
  ): Promise<Feature> {
    await traceNetwork('addFeature', { projectId, name, description });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          const newFeature: Feature = {
            id: `feat-${Date.now()}`,
            name,
            projectId,
            description,
            tasks: [],
            status: 'pending',
          };
          project.features.push(newFeature);
          resolve(newFeature);
        }
      }, 200);
    });
  },

  async updateFeature(projectId: string, featureId: string, updates: Partial<Feature>): Promise<Feature> {
    await traceNetwork('updateFeature', { projectId, featureId, updates });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          const feature = project.features.find((f) => f.id === featureId);
          if (feature) {
            Object.assign(feature, updates);
            resolve(feature);
          }
        }
      }, 200);
    });
  },

  async deleteFeature(projectId: string, featureId: string): Promise<void> {
    await traceNetwork('deleteFeature', { projectId, featureId });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          const index = project.features.findIndex((f) => f.id === featureId);
          if (index > -1) {
            project.features.splice(index, 1);
          }
        }
        resolve();
      }, 200);
    });
  },

  // Tasks
  async addTask(
    projectId: string,
    featureId: string,
    name: string,
    effortLines: TaskEffortLine[],
    description: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<Task> {
    await traceNetwork('addTask', { projectId, featureId, name, effortLines, description, priority });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          const feature = project.features.find((f) => f.id === featureId);
          if (feature) {
            const taskTotal = effortLines.reduce((s, line) => s + line.hours, 0);

            const newTask: Task = {
              id: `task-${Date.now()}`,
              name,
              featureId,
              effortLines: effortLines.map((line) => ({ ...line })),
              priority,
              risk: taskTotal > 60 ? 'high' : taskTotal > 30 ? 'medium' : 'low',
              description,
            };
            feature.tasks.push(newTask);
            resolve(newTask);
          }
        }
      }, 200);
    });
  },

  async updateTask(projectId: string, featureId: string, taskId: string, updates: Partial<Task>): Promise<Task> {
    await traceNetwork('updateTask', { projectId, featureId, taskId, updates });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          const feature = project.features.find((f) => f.id === featureId);
          if (feature) {
            const task = feature.tasks.find((t) => t.id === taskId);
            if (task) {
              Object.assign(task, updates);
              resolve(task);
            }
          }
        }
      }, 200);
    });
  },

  async deleteTask(projectId: string, featureId: string, taskId: string): Promise<void> {
    await traceNetwork('deleteTask', { projectId, featureId, taskId });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          const feature = project.features.find((f) => f.id === featureId);
          if (feature) {
            const index = feature.tasks.findIndex((t) => t.id === taskId);
            if (index > -1) {
              feature.tasks.splice(index, 1);
            }
          }
        }
        resolve();
      }, 200);
    });
  },

  // Clarifications
  async addClarification(
    projectId: string,
    question: string,
    context?: { featureId?: string; taskId?: string }
  ): Promise<Clarification> {
    await traceNetwork('addClarification', { projectId, question, context });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          const feature =
            context?.featureId != null
              ? project.features.find((f) => f.id === context.featureId)
              : undefined;
          const task =
            context?.taskId != null && feature
              ? feature.tasks.find((t) => t.id === context.taskId)
              : undefined;

          const newClarification: Clarification = {
            id: `clar-${Date.now()}`,
            projectId,
            question,
            status: 'pending',
            impact: 'medium',
            createdAt: new Date().toISOString(),
            ...(feature
              ? {
                  featureId: feature.id,
                  featureName: feature.name,
                }
              : {}),
            ...(task
              ? {
                  taskId: task.id,
                  taskName: task.name,
                }
              : {}),
          };
          project.clarifications.push(newClarification);
          resolve(newClarification);
        }
      }, 200);
    });
  },

  async answerClarification(
    projectId: string,
    clarificationId: string,
    answer: string
  ): Promise<Clarification> {
    await traceNetwork('answerClarification', { projectId, clarificationId, answer });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          const clarification = project.clarifications.find((c) => c.id === clarificationId);
          if (clarification) {
            clarification.answer = answer;
            clarification.status = 'answered';
            resolve(clarification);
          }
        }
      }, 200);
    });
  },

  // Estimation
  async calculateEstimation(projectId: string): Promise<Project['estimation']> {
    await traceNetwork('calculateEstimation', { projectId });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          const rollup = computeEffortRollupFromFeatures(project.features);
          const pendingClarifications = project.clarifications.filter((c) => c.status === 'pending').length;
          const confidence = Math.max(50, 95 - pendingClarifications * 5);

          const risks: string[] = [];
          if (rollup.devHours > 100) risks.push('Large scope requires phased approach');
          if (pendingClarifications > 0) risks.push(`${pendingClarifications} clarification(s) pending`);
          if (rollup.totalHours > project.budget * 0.6) risks.push('Timeline tight for budget');

          const estimation: Project['estimation'] = {
            ...rollup,
            confidence,
            risks,
          };

          project.estimation = estimation;
          resolve(estimation);
        }
      }, 400);
    });
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    await traceNetwork('getNotifications');
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockNotifications]), 200);
    });
  },

  async markNotificationRead(id: string): Promise<void> {
    await traceNetwork('markNotificationRead', { id });
    return new Promise((resolve) => {
      setTimeout(() => {
        const notif = mockNotifications.find((n) => n.id === id);
        if (notif) {
          notif.read = true;
        }
        resolve();
      }, 100);
    });
  },

  // Export
  async exportToExcel(projectId: string): Promise<string> {
    await traceNetwork('exportToExcel', { projectId });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          // Simulate file generation
          resolve(`estimation-${project.name.replace(/\s+/g, '-')}-${Date.now()}.xlsx`);
        }
      }, 800);
    });
  },

  async exportToPdf(projectId: string): Promise<string> {
    await traceNetwork('exportToPdf', { projectId });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          // Simulate file generation
          resolve(`estimation-${project.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
        }
      }, 800);
    });
  },

  // Re-estimation
  async reEstimate(projectId: string): Promise<void> {
    await traceNetwork('reEstimate', { projectId });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          const rollup = computeEffortRollupFromFeatures(project.features);
          const { devHours: totalDevHours, qaHours: totalQaHours, pmHours: totalPmHours, totalHours } = rollup;
          const highPriorityCount = project.features.reduce(
            (count, f) => count + f.tasks.filter((t) => t.priority === 'high').length,
            0
          );
          const highRiskCount = project.features.reduce(
            (count, f) => count + f.tasks.filter((t) => t.risk === 'high').length,
            0
          );

          // Adjust confidence based on risks
          let confidence = 85;
          if (highRiskCount > 0) confidence -= highRiskCount * 5;
          if (highPriorityCount > 5) confidence -= 10;
          confidence = Math.max(50, Math.min(95, confidence));

          project.estimation = {
            devHours: totalDevHours,
            qaHours: totalQaHours,
            pmHours: totalPmHours,
            totalHours,
            confidence,
            risks: highRiskCount > 0 ? [`${highRiskCount} high-risk tasks detected`] : [],
            effortByRoleLevel: rollup.effortByRoleLevel,
          };
        }
        resolve();
      }, 500);
    });
  },
};
