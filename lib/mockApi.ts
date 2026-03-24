// Mock API Service with realistic project estimation data

export interface Task {
  id: string;
  name: string;
  featureId: string;
  devHours: number;
  qaHours: number;
  pmHours: number;
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
  question: string;
  answer?: string;
  status: 'pending' | 'answered';
  createdAt: string;
}

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
  features: Feature[];
  clarifications: Clarification[];
  estimation?: {
    devHours: number;
    qaHours: number;
    pmHours: number;
    totalHours: number;
    confidence: number;
    risks: string[];
  };
}

export interface Notification {
  id: string;
  projectId: string;
  type: 'risk' | 'budget' | 'clarification' | 'milestone';
  message: string;
  severity: 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

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
          { id: 'task-001', name: 'Design new UI mockups', featureId: 'feat-001', devHours: 20, qaHours: 5, pmHours: 8, priority: 'high', risk: 'low', description: 'Create responsive designs' },
          { id: 'task-002', name: 'Frontend implementation', featureId: 'feat-001', devHours: 40, qaHours: 10, pmHours: 5, priority: 'high', risk: 'medium', description: 'React component development' },
        ],
      },
      {
        id: 'feat-002',
        name: 'Search & Filter Enhancement',
        projectId: 'proj-001',
        description: 'Advanced search capabilities',
        status: 'confirmed',
        tasks: [
          { id: 'task-003', name: 'Elasticsearch integration', featureId: 'feat-002', devHours: 30, qaHours: 8, pmHours: 6, priority: 'medium', risk: 'medium', description: 'Setup and configure search' },
        ],
      },
    ],
    clarifications: [
      {
        id: 'clar-001',
        projectId: 'proj-001',
        question: 'Should old data be migrated?',
        answer: 'Yes, migrate last 2 years of products',
        status: 'answered',
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
          { id: 'task-004', name: 'Backend auth API', featureId: 'feat-003', devHours: 25, qaHours: 8, pmHours: 4, priority: 'high', risk: 'low', description: 'JWT implementation' },
          { id: 'task-005', name: 'Mobile login UI', featureId: 'feat-003', devHours: 15, qaHours: 5, pmHours: 3, priority: 'high', risk: 'low', description: 'React Native screens' },
        ],
      },
      {
        id: 'feat-004',
        name: 'Feed & Social Features',
        projectId: 'proj-002',
        description: 'User feed with likes and comments',
        status: 'pending',
        tasks: [
          { id: 'task-006', name: 'Real-time notifications', featureId: 'feat-004', devHours: 35, qaHours: 12, pmHours: 6, priority: 'high', risk: 'high', description: 'WebSocket integration' },
        ],
      },
    ],
    clarifications: [
      {
        id: 'clar-002',
        projectId: 'proj-002',
        question: 'Target iOS, Android, or both?',
        status: 'pending',
        createdAt: '2024-03-15',
      },
      {
        id: 'clar-003',
        projectId: 'proj-002',
        question: 'Expected user base at launch?',
        status: 'pending',
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
    features: [],
    clarifications: [],
  },
];

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
    documentName?: string
  ): Promise<Project> {
    await traceNetwork('createProject', { name, type, budget, template, documentName });
    return new Promise((resolve) => {
      setTimeout(() => {
        const newProject: Project = {
          id: `proj-${String(mockProjects.length + 1).padStart(3, '0')}`,
          name,
          type,
          status: 'analyzing',
          budget,
          template,
          documentName,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
          features: [],
          clarifications: [],
        };
        mockProjects.push(newProject);
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
    devHours: number,
    qaHours: number,
    pmHours: number,
    description: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<Task> {
    await traceNetwork('addTask', { projectId, featureId, name, devHours, qaHours, pmHours, description, priority });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          const feature = project.features.find((f) => f.id === featureId);
          if (feature) {
            const newTask: Task = {
              id: `task-${Date.now()}`,
              name,
              featureId,
              devHours,
              qaHours,
              pmHours,
              priority,
              risk: pmHours > 20 ? 'high' : pmHours > 10 ? 'medium' : 'low',
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
  async addClarification(projectId: string, question: string): Promise<Clarification> {
    await traceNetwork('addClarification', { projectId, question });
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = mockProjects.find((p) => p.id === projectId);
        if (project) {
          const newClarification: Clarification = {
            id: `clar-${Date.now()}`,
            projectId,
            question,
            status: 'pending',
            createdAt: new Date().toISOString(),
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
          let devHours = 0;
          let qaHours = 0;
          let pmHours = 0;

          project.features.forEach((feature) => {
            feature.tasks.forEach((task) => {
              devHours += task.devHours;
              qaHours += task.qaHours;
              pmHours += task.pmHours;
            });
          });

          const pendingClarifications = project.clarifications.filter((c) => c.status === 'pending').length;
          const confidence = Math.max(50, 95 - pendingClarifications * 5);

          const risks: string[] = [];
          if (devHours > 100) risks.push('Large scope requires phased approach');
          if (pendingClarifications > 0) risks.push(`${pendingClarifications} clarification(s) pending`);
          if (devHours + qaHours + pmHours > project.budget * 0.6) risks.push('Timeline tight for budget');

          const estimation: Project['estimation'] = {
            devHours,
            qaHours,
            pmHours,
            totalHours: devHours + qaHours + pmHours,
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
          // Recalculate estimation based on current features and tasks
          let totalDevHours = 0;
          let totalQaHours = 0;
          let totalPmHours = 0;

          project.features.forEach((feature) => {
            feature.tasks.forEach((task) => {
              totalDevHours += task.devHours;
              totalQaHours += task.qaHours;
              totalPmHours += task.pmHours;
            });
          });

          const totalHours = totalDevHours + totalQaHours + totalPmHours;
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
          };
        }
        resolve();
      }, 500);
    });
  },
};
