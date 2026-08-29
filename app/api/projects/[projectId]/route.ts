import { NextResponse } from 'next/server';
import { requireWorkspace } from '../../../../lib/auth';
import { store } from '../../../../lib/server-store';

export async function GET(_: Request, context: { params: Promise<{ projectId: string }> }) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const { projectId } = await context.params;
  const project = store.projects.get(projectId);
  return project ? NextResponse.json(project) : NextResponse.json({ message: '项目不存在' }, { status: 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const { projectId } = await context.params;
  const project = store.projects.get(projectId);
  if (!project) return NextResponse.json({ message: '项目不存在' }, { status: 404 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (typeof body.title === 'string') project.title = project.canvas.title = body.title;
  project.updatedAt = new Date().toISOString();
  return NextResponse.json(project);
}

export async function DELETE(_: Request, context: { params: Promise<{ projectId: string }> }) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const { projectId } = await context.params;
  store.projects.delete(projectId);
  return NextResponse.json({ ok: true });
}
