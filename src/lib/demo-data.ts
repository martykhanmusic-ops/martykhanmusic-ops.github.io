import type { PipelineStep, Project, PipelineStatus } from './types';

export const workflowCards = [
  { title: 'User Input', description: 'Plain-English product brief captured with context, constraints, and success criteria.', accent: 'blue' },
  { title: 'Request Received', description: 'Prompt normalized, scoped, and converted into a traceable build request.', accent: 'blue' },
  { title: 'Analyze & Plan', description: 'AI planner maps routes, schema, UI states, services, and deployment targets.', accent: 'purple' },
  { title: 'Generate Code', description: 'Full-stack code, components, API handlers, tests, and infra files are generated.', accent: 'blue' },
  { title: 'Validate & Test', description: 'Type checks, linting, unit tests, accessibility checks, and build verification.', accent: 'green' },
  { title: 'Package App', description: 'Docker image and immutable release bundle prepared with provenance metadata.', accent: 'green' },
  { title: 'Provision Infrastructure', description: 'Databases, secrets, cache, queues, and edge runtime are allocated.', accent: 'blue' },
  { title: 'Deploy', description: 'Canary deployment rolls out with automated rollback and smoke tests.', accent: 'green' },
  { title: 'App Live', description: 'Production URL, observability, and release notes are published to the workspace.', accent: 'green' },
  { title: 'Observe & Improve', description: 'Purple feedback loop monitors telemetry, user notes, and scaling signals.', accent: 'purple' }
] as const;

export const demoProjects: Project[] = [
  {
    id: 'prj_stackfast_001',
    name: 'Atlas CRM Copilot',
    description: 'AI-native sales CRM with lead scoring, task automation, and Slack alerts.',
    prompt: 'Build a CRM for B2B sales teams with AI lead scoring, notes, pipeline stages, Slack notifications, and Postgres auth.',
    status: 'deploying',
    currentStep: 7,
    createdAt: '2026-05-02T14:12:00.000Z',
    updatedAt: '2026-05-08T09:30:00.000Z'
  },
  {
    id: 'prj_stackfast_002',
    name: 'LaunchPad Portal',
    description: 'Customer portal for onboarding, invoices, knowledge base, and usage analytics.',
    prompt: 'Create a customer success portal with onboarding checklists, Stripe billing, docs search, admin roles, and charts.',
    status: 'live',
    currentStep: 9,
    createdAt: '2026-04-22T11:45:00.000Z',
    updatedAt: '2026-05-07T20:18:00.000Z'
  },
  {
    id: 'prj_stackfast_003',
    name: 'PulseOps Monitor',
    description: 'Internal incident dashboard with runbooks, metrics, escalation, and audit history.',
    prompt: 'Make an incident command center with live metrics, runbooks, PagerDuty-like escalation, and compliance audit logs.',
    status: 'building',
    currentStep: 3,
    createdAt: '2026-05-06T08:00:00.000Z',
    updatedAt: '2026-05-08T10:02:00.000Z'
  }
];

export const buildPipeline = (projectId = 'prj_stackfast_001', currentStep = 7): PipelineStep[] =>
  workflowCards.map((card, index) => {
    const status: PipelineStatus = index < currentStep ? 'complete' : index === currentStep ? 'running' : 'pending';
    return {
      id: `step_${index + 1}`,
      projectId,
      title: card.title,
      description: card.description,
      status,
      logs: [
        `[${new Date(Date.UTC(2026, 4, 8, 9, index * 4)).toISOString()}] ${card.title} queued`,
        status === 'complete'
          ? `[${new Date(Date.UTC(2026, 4, 8, 9, index * 4 + 2)).toISOString()}] ${card.title} completed successfully`
          : status === 'running'
            ? `[${new Date(Date.UTC(2026, 4, 8, 9, index * 4 + 2)).toISOString()}] ${card.title} is streaming progress events`
            : `[${new Date(Date.UTC(2026, 4, 8, 9, index * 4 + 2)).toISOString()}] Waiting for upstream artifact`
      ]
    };
  });

export const demoPipeline = buildPipeline();

export const stackItems = ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'PostgreSQL', 'Docker', 'Edge Runtime', 'OpenTelemetry'];

export const navItems = [
  'Dashboard',
  'New Project',
  'Projects',
  'Templates',
  'Deployments',
  'Environments',
  'Usage',
  'Team',
  'Settings',
  'Billing'
];
