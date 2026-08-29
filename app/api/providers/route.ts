import { NextResponse } from 'next/server';
import { requireWorkspace } from '../../../lib/auth';
import { safeProvider, store } from '../../../lib/server-store';
import { encryptSecret } from '../../../lib/secret';

export async function GET() {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  return NextResponse.json([...store.providers.values()].map(safeProvider));
}

export async function POST(request: Request) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  if (!body.name || !body.baseUrl) return NextResponse.json({ message: '名称和 Base URL 为必填项' }, { status: 400 });
  const id = `provider-${crypto.randomUUID()}`;
  const provider = { id, name: String(body.name), protocol: (body.protocol === 'gemini' ? 'gemini' : 'openai') as 'openai' | 'gemini', baseUrl: String(body.baseUrl), apiKey: encryptSecret(String(body.apiKey ?? '')), hidden: false, models: [] };
  store.providers.set(id, provider);
  return NextResponse.json(safeProvider(provider), { status: 201 });
}
