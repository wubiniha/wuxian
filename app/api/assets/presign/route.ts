import { NextResponse } from 'next/server';
import { requireWorkspace } from '../../../../lib/auth';

export async function POST(request: Request) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  return NextResponse.json({ uploadUrl: null, objectKey: `assets/${crypto.randomUUID()}-${body.name ?? 'upload'}`, mode: process.env.S3_ENDPOINT ? 'presigned' : 'local-fallback', message: process.env.S3_ENDPOINT ? '请使用对象存储上传地址' : '当前为本地开发回退模式' });
}
