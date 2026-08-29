import { NextResponse } from 'next/server';
import { requireWorkspace } from '../../../../../lib/auth';
import { store } from '../../../../../lib/server-store';
import type { CanvasNode } from '../../../../../lib/canvas/types';
import { decryptSecret } from '../../../../../lib/secret';

type ProviderResponse = { id?: string; request_id?: string; error?: { message?: string }; choices?: Array<{ message?: { content?: string } }>; data?: Array<{ url?: string }> };

async function callOpenRouter(node: CanvasNode) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('尚未配置 OPENROUTER_API_KEY，请到云服务器环境变量中配置');
  const config = node.data.config;
  const model = String(config.modelId ?? '').replace('openrouter::', '');
  if (!['bytedance/seedance-2.5', 'alibaba/wan-3.0', 'bytedance/seedance-2.0-mini'].includes(model)) throw new Error('视频模型不在首期支持范围内');
  const response = await fetch('https://openrouter.ai/api/v1/videos', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER ?? 'http://localhost:11081', 'X-Title': process.env.OPENROUTER_TITLE ?? 'Wuxian Canvas' }, body: JSON.stringify({ model, prompt: node.data.body, duration: Number(config.duration ?? 5), resolution: config.resolution ?? '720p', aspect_ratio: config.aspectRatio ?? '16:9', generate_audio: config.generateAudio !== false }) });
  const data = await response.json().catch(() => ({})) as ProviderResponse;
  if (!response.ok) throw new Error(data?.error?.message ?? '视频任务提交失败');
  return { jobId: data.id ?? data.request_id, provider: 'OpenRouter' };
}

async function pollVideoRun(runId: string, jobId: string) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const response = await fetch(`https://openrouter.ai/api/v1/videos/${encodeURIComponent(jobId)}`, { headers: { Authorization: `Bearer ${key}` } }).catch(() => null);
    const data = await response?.json().catch(() => ({})) as { status?: string; url?: string; video?: { url?: string }; error?: { message?: string } };
    if (!response?.ok) continue;
    const url = data.url ?? data.video?.url;
    if (url || data.status === 'completed' || data.status === 'succeeded') { store.runs.set(runId, { ...store.runs.get(runId)!, status: 'success', output: { url, jobId }, updatedAt: new Date().toISOString() }); return; }
    if (data.status === 'failed' || data.status === 'error') { store.runs.set(runId, { ...store.runs.get(runId)!, status: 'failed', error: data.error?.message ?? '视频生成失败', updatedAt: new Date().toISOString() }); return; }
  }
  store.runs.set(runId, { ...store.runs.get(runId)!, status: 'failed', error: '视频任务轮询超时', updatedAt: new Date().toISOString() });
}

async function callCompatible(node: CanvasNode, providerId: string) {
  const provider = store.providers.get(providerId) ?? store.providers.get('compatible');
  if (!provider?.baseUrl || !provider.apiKey) throw new Error('请先在设置中心配置兼容服务商的 Base URL 和 API Key');
  const base = provider.baseUrl.replace(/\/$/, '');
  const headers = { Authorization: `Bearer ${decryptSecret(provider.apiKey)}`, 'Content-Type': 'application/json' };
  if (node.data.type === 'text') {
    const response = await fetch(`${base}/chat/completions`, { method: 'POST', headers, body: JSON.stringify({ model: node.data.config.modelId ?? 'text-model', messages: [{ role: 'system', content: node.data.config.system ?? '' }, { role: 'user', content: node.data.body }], temperature: Number(node.data.config.temperature ?? 0.7), max_tokens: Number(node.data.config.maxTokens ?? 1200) }) });
    const data = await response.json().catch(() => ({})) as ProviderResponse;
    if (!response.ok) throw new Error(data?.error?.message ?? '文字任务失败');
    return { text: data.choices?.[0]?.message?.content ?? '', raw: data };
  }
  if (node.data.type === 'image') {
    const response = await fetch(`${base}/images/generations`, { method: 'POST', headers, body: JSON.stringify({ model: node.data.config.modelId ?? 'image-model', prompt: node.data.body, n: Number(node.data.config.count ?? 1), size: String(node.data.config.aspectRatio ?? '16:9') }) });
    const data = await response.json().catch(() => ({})) as ProviderResponse;
    if (!response.ok) throw new Error(data?.error?.message ?? '图片任务失败');
    return { url: data.data?.[0]?.url, raw: data };
  }
  const response = await fetch(`${base}/audio/speech`, { method: 'POST', headers, body: JSON.stringify({ model: node.data.config.modelId ?? 'audio-model', input: node.data.body, voice: node.data.config.voice ?? 'alloy', response_format: node.data.config.format ?? 'wav', speed: Number(node.data.config.speed ?? 1) }) });
  if (!response.ok) { const data = await response.json().catch(() => ({})) as ProviderResponse; throw new Error(data?.error?.message ?? '语音任务失败'); }
  return { url: `data:${response.headers.get('content-type') ?? 'audio/wav'};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}` };
}

export async function POST(request: Request, context: { params: Promise<{ nodeId: string }> }) {
  if (!(await requireWorkspace())) return NextResponse.json({ message: '工作区令牌无效' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const node = body.node as CanvasNode | undefined;
  if (!node || node.id !== (await context.params).nodeId) return NextResponse.json({ message: '节点参数无效' }, { status: 400 });
  const run = { id: crypto.randomUUID(), nodeId: node.id, status: 'running' as const, model: String(node.data.config.modelId ?? ''), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  store.runs.set(run.id, run);
  try {
    const provider = String(node.data.config.modelId ?? '').split('::')[0];
    const output = node.data.type === 'video' ? await callOpenRouter(node) : await callCompatible(node, provider);
    if (node.data.type === 'video' && 'jobId' in output && output.jobId) {
      const submitted = { ...run, status: 'running' as const, output, updatedAt: new Date().toISOString() };
      store.runs.set(run.id, submitted);
      void pollVideoRun(run.id, String(output.jobId));
      return NextResponse.json({ runId: run.id, pending: true, output }, { status: 202 });
    }
    const completed = { ...run, status: 'success' as const, output, updatedAt: new Date().toISOString() };
    store.runs.set(run.id, completed);
    return NextResponse.json({ runId: run.id, output });
  } catch (error) {
    const message = error instanceof Error ? error.message : '节点运行失败';
    store.runs.set(run.id, { ...run, status: 'failed', error: message, updatedAt: new Date().toISOString() });
    return NextResponse.json({ runId: run.id, message }, { status: 502 });
  }
}
