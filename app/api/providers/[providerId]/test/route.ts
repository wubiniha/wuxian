import { NextResponse } from 'next/server';
import { requireWorkspace } from '../../../../../lib/auth';
import { store } from '../../../../../lib/server-store';
import { decryptSecret } from '../../../../../lib/secret';

export async function POST(_: Request, context: { params: Promise<{ providerId: string }> }) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const provider = store.providers.get((await context.params).providerId);
  if (!provider) return NextResponse.json({ message: '服务商不存在' }, { status: 404 });
  if (!decryptSecret(provider.apiKey) && provider.id !== 'compatible') return NextResponse.json({ ok: false, message: '尚未配置 API Key' }, { status: 400 });
  return NextResponse.json({ ok: true, message: '连接配置已通过基础检查' });
}
