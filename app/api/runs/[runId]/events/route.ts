import { store } from '../../../../../lib/server-store';

export async function GET(_: Request, context: { params: Promise<{ runId: string }> }) {
  const runId = (await context.params).runId;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({ start(controller) { const push = () => { const run = store.runs.get(runId); controller.enqueue(encoder.encode(`event: status\ndata: ${JSON.stringify(run ?? { id: runId, status: 'failed', error: '运行记录不存在' })}\n\n`)); if (run?.status === 'success' || run?.status === 'failed') { clearInterval(timer); controller.close(); } }; const timer = setInterval(push, 1200); push(); } });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
}
