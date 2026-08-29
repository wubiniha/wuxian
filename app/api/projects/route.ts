import { NextResponse } from 'next/server';
import { requireWorkspace } from '../../../lib/auth';
import { ensureProject, store } from '../../../lib/server-store';

export async function GET() {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  return NextResponse.json([...store.projects.values()].map((project) => ({ id: project.id, title: project.title, createdAt: project.createdAt, updatedAt: project.updatedAt })));
}

export async function POST(request: Request) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  return NextResponse.json(ensureProject(typeof body.title === 'string' ? body.title : undefined), { status: 201 });
}
