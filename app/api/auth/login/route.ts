import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { token?: string };
  const expected = process.env.WORKSPACE_TOKEN;
  if (expected && body.token !== expected) return NextResponse.json({ message: '工作区令牌不正确' }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  if (expected) response.cookies.set('wuxian_workspace', expected, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return response;
}
