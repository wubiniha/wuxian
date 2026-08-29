import { NextResponse } from 'next/server';
import { requireWorkspace } from '../../../../../lib/auth';
import { store } from '../../../../../lib/server-store';

export async function GET(_: Request, context: { params: Promise<{ projectId: string }> }) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const { projectId } = await context.params;
  const project = store.projects.get(projectId);
  return project ? NextResponse.json(project.canvas) : NextResponse.json({ message: '项目不存在' }, { status: 404 });
}

export async function PUT(request: Request, context: { params: Promise<{ projectId: string }> }) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const { projectId } = await context.params;
  const project = store.projects.get(projectId);
  if (!project) return NextResponse.json({ message: '项目不存在' }, { status: 404 });
  const incoming = await request.json() as Record<string, unknown>;
  if (typeof incoming.version === 'number' && incoming.version < project.canvas.version) return NextResponse.json({ message: '云端版本更新，请选择恢复来源', cloud: project.canvas }, { status: 409 });
  project.canvas = { ...project.canvas, ...incoming, projectId, version: project.canvas.version + 1, updatedAt: new Date().toISOString() };
  project.updatedAt = project.canvas.updatedAt;
  return NextResponse.json(project.canvas);
}
