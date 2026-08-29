import { NextResponse } from 'next/server';
import { requireWorkspace } from '../../../../lib/auth';
import { safeProvider, store } from '../../../../lib/server-store';
import { encryptSecret } from '../../../../lib/secret';

export async function PATCH(request: Request, context: { params: Promise<{ providerId: string }> }) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const { providerId } = await context.params;
  const provider = store.providers.get(providerId);
  if (!provider) return NextResponse.json({ message: '服务商不存在' }, { status: 404 });
  const body = await request.json() as Record<string, unknown>;
  Object.assign(provider, { ...body, ...(typeof body.apiKey === 'string' ? { apiKey: encryptSecret(body.apiKey) } : {}) });
  return NextResponse.json(safeProvider(provider));
}

export async function DELETE(_: Request, context: { params: Promise<{ providerId: string }> }) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  store.providers.delete((await context.params).providerId);
  return NextResponse.json({ ok: true });
}
