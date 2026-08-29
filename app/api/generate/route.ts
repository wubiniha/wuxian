import { NextRequest, NextResponse } from 'next/server'

const allowedVideoModels = new Set([
  'bytedance/seedance-2.5',
  'alibaba/wan-3.0',
  'bytedance/seedance-2.0-mini',
])

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return NextResponse.json({ message: '尚未配置 OPENROUTER_API_KEY' }, { status: 503 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const model = typeof body?.model === 'string' ? body.model : ''
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  if (!allowedVideoModels.has(model)) return NextResponse.json({ message: '当前只支持 Seedance 2.5、Wan 3.0、Seedance 2.0 Mini' }, { status: 400 })
  if (!prompt) return NextResponse.json({ message: '请先填写视频提示词' }, { status: 400 })

  const duration = typeof body?.duration === 'number' ? Math.max(4, Math.min(30, Math.round(body.duration))) : 5
  const resolution = body?.resolution === '720p' || body?.resolution === '1080p' ? body.resolution : '480p'
  const aspectRatio = typeof body?.aspectRatio === 'string' ? body.aspectRatio : '16:9'
  const generateAudio = body?.generateAudio !== false
  const references = Array.isArray(body?.references) ? body.references.filter((item): item is string => typeof item === 'string' && item.startsWith('data:')).slice(0, 4) : []

  if (model === 'bytedance/seedance-2.5') {
    const modelCheck = await fetch('https://openrouter.ai/api/v1/videos/models', { headers: { Authorization: `Bearer ${apiKey}` } })
    if (!modelCheck.ok) return NextResponse.json({ message: '无法读取 OpenRouter 视频模型状态' }, { status: 502 })
    const catalog = await modelCheck.json().catch(() => null) as { data?: Array<{ id?: string }> } | null
    if (!catalog?.data?.some((item) => item.id === model)) return NextResponse.json({ message: 'Seedance 2.5 当前不可用' }, { status: 503 })
  }

  const payload: Record<string, unknown> = { model, prompt, duration, resolution, aspect_ratio: aspectRatio, generate_audio: generateAudio }
  if (references.length > 0) payload.input_references = references.map((url) => ({ type: 'image_url', image_url: { url } }))
  const response = await fetch('https://openrouter.ai/api/v1/videos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:11081', 'X-Title': process.env.OPENROUTER_TITLE || 'Wuxian Canvas' },
    body: JSON.stringify(payload),
  })
  const result = await response.json().catch(() => null) as { id?: string; error?: { message?: string } } | null
  if (!response.ok) return NextResponse.json({ message: result?.error?.message || '模型提交失败' }, { status: response.status })
  return NextResponse.json({ jobId: result?.id || '', status: 'queued' })
}
