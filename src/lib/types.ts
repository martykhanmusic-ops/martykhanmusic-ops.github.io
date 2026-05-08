export type PipelineStatus = 'pending' | 'running' | 'complete' | 'failed';
export type ProjectStatus = 'draft' | 'planning' | 'building' | 'testing' | 'deploying' | 'live' | 'failed';

export interface PipelineStep {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: PipelineStatus;
  logs: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  prompt: string;
  status: ProjectStatus;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
}
