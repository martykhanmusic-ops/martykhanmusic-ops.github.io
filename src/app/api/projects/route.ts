import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildPipeline, demoProjects } from '@/lib/demo-data';
import type { Project } from '@/lib/types';

const createProjectSchema = z.object({
  prompt: z.string().min(12),
  name: z.string().min(2).optional(),
  description: z.string().optional()
});

export async function GET() {
  return NextResponse.json({ projects: demoProjects });
}

export async function POST(request: Request) {
  const body = createProjectSchema.parse(await request.json());
  const now = new Date().toISOString();
  const project: Project = {
    id: `prj_${crypto.randomUUID()}`,
    name: body.name ?? inferProjectName(body.prompt),
    description: body.description ?? 'AI-generated full-stack application created from a natural-language prompt.',
    prompt: body.prompt,
    status: 'planning',
    currentStep: 2,
    createdAt: now,
    updatedAt: now
  };

  return NextResponse.json({ project, pipeline: buildPipeline(project.id, project.currentStep) }, { status: 201 });
}

function inferProjectName(prompt: string) {
  const words = prompt.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3);
  return words.length ? `${words.map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ')} App` : 'Untitled Stackfast App';
}
