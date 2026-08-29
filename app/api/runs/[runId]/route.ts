import { NextResponse } from 'next/server';
import { store } from '../../../../lib/server-store';

export async function GET(_: Request, context: { params: Promise<{ runId: string }> }) {
  const run = store.runs.get((await context.params).runId);
  return run ? NextResponse.json(run) : NextResponse.json({ message: '运行记录不存在' }, { status: 404 });
}
