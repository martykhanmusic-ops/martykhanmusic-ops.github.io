import { NextResponse } from 'next/server';
import { buildPipeline } from '@/lib/demo-data';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const tick = Math.floor(Date.now() / 4000) % 10;
  const pipeline = buildPipeline(params.id, tick);
  return NextResponse.json({ projectId: params.id, progress: Math.round(((tick + 1) / pipeline.length) * 100), pipeline });
}
