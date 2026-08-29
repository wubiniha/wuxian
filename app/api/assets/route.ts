import { NextResponse } from 'next/server';
import { requireWorkspace } from '../../../lib/auth';
import { store } from '../../../lib/server-store';

export async function GET() {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  return NextResponse.json([...store.assets.values()]);
}

export async function POST(request: Request) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const kind = body.kind === 'video' || body.kind === 'audio' ? body.kind : 'image';
  const asset: import('../../../lib/canvas/types').AssetRecord = { id: crypto.randomUUID(), name: String(body.name ?? '未命名素材'), kind: kind as import('../../../lib/canvas/types').AssetKind, mimeType: String(body.mimeType ?? ''), size: Number(body.size ?? 0), url: String(body.url ?? ''), createdAt: new Date().toISOString() };
  store.assets.set(asset.id, asset);
  return NextResponse.json(asset, { status: 201 });
}
