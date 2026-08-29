import { NextResponse } from 'next/server';
import { requireWorkspace } from '../../../lib/auth';
import { safeProvider, store } from '../../../lib/server-store';
import type { ModelConfig } from '../../../lib/canvas/types';

type SettingsState = { concurrency: { text: number; image: number; video: number; audio: number } };

export async function GET() {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  return NextResponse.json({ defaults: store.defaults, providers: [...store.providers.values()].map(safeProvider) });
}

export async function PATCH(request: Request) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown> & { defaults?: { models?: ModelConfig[]; concurrency?: Partial<SettingsState['concurrency']> } };
  if (body.defaults?.models) store.defaults.models = body.defaults.models;
  if (body.defaults?.concurrency) store.defaults.concurrency = { ...store.defaults.concurrency, ...body.defaults.concurrency };
  return NextResponse.json({ defaults: store.defaults, providers: [...store.providers.values()].map(safeProvider) });
}
