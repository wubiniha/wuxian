import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return NextResponse.json({ message: '尚未配置 OPENROUTER_API_KEY' }, { status: 503 })
  const { jobId } = await context.params
  const response = await fetch(`https://openrouter.ai/api/v1/videos/${encodeURIComponent(jobId)}`, { headers: { Authorization: `Bearer ${apiKey}` } })
  const result = await response.json().catch(() => null)
  return NextResponse.json(result, { status: response.status })
}
