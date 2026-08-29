import { cookies } from 'next/headers';

export async function requireWorkspace() {
  const expected = process.env.WORKSPACE_TOKEN;
  if (!expected) return true;
  const cookieStore = await cookies();
  return cookieStore.get('wuxian_workspace')?.value === expected;
}

