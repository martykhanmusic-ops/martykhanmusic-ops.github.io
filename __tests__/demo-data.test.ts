import { describe, expect, it } from 'vitest';
import { buildPipeline, demoProjects, workflowCards } from '@/lib/demo-data';

describe('STACKFAST demo data', () => {
  it('keeps workflow cards aligned to generated pipeline steps', () => {
    const pipeline = buildPipeline('project_test', 4);
    expect(pipeline).toHaveLength(workflowCards.length);
    expect(pipeline[4].status).toBe('running');
    expect(pipeline.at(-1)?.projectId).toBe('project_test');
  });

  it('ships seed projects for the dashboard', () => {
    expect(demoProjects.length).toBeGreaterThanOrEqual(3);
    expect(demoProjects[0]).toMatchObject({ id: expect.any(String), prompt: expect.any(String) });
  });
});
