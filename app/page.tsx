'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type NodeKind = 'script' | 'character' | 'image' | 'video' | 'note';
type CanvasNode = { id: string; kind: NodeKind; x: number; y: number; title: string; subtitle: string; body?: string; accent: string; meta?: string };
type Edge = { from: string; to: string };
type DragState =
  | { mode: 'pan'; x: number; y: number; panX: number; panY: number }
  | { mode: 'node'; nodeId: string; x: number; y: number; nodeX: number; nodeY: number }
  | null;

const nodeSize: Record<NodeKind, { width: number; height: number }> = {
  script: { width: 320, height: 235 }, character: { width: 278, height: 228 }, image: { width: 300, height: 248 }, video: { width: 318, height: 256 }, note: { width: 264, height: 190 },
};

const initialNodes: CanvasNode[] = [
  { id: 'script-01', kind: 'script', x: 140, y: 148, title: '第一幕 · 雨夜抵达', subtitle: 'SCRIPT / 01', body: '深夜的旧火车站，林舟拖着行李箱下车。远处霓虹在雨幕里晕开。', accent: '#ed6a5a', meta: '已整理 · 428 字' },
  { id: 'character-01', kind: 'character', x: 570, y: 84, title: '林舟', subtitle: 'CHARACTER / 01', body: '27 岁，独立纪录片导演。克制、敏锐，习惯把情绪藏进镜头后。', accent: '#8a78ed', meta: '角色设定 · 3 个引用' },
  { id: 'image-01', kind: 'image', x: 558, y: 386, title: '车站 · 氛围探索', subtitle: 'IMAGE / 04', body: '35mm 胶片质感，冷蓝雨夜，孤独的红色霓虹。', accent: '#4d9de0', meta: '4 张变体 · 1024 × 1365' },
  { id: 'video-01', kind: 'video', x: 1004, y: 292, title: '镜头 01 · 长镜头', subtitle: 'VIDEO / 01', body: '镜头从站牌缓慢推向林舟，雨声渐强，车门在画外关上。', accent: '#38b883', meta: 'Seedance 2.5 · 5 秒' },
  { id: 'note-01', kind: 'note', x: 1030, y: 38, title: '导演笔记', subtitle: 'NOTE / 02', body: '保持留白。让环境先于台词说话。', accent: '#e1a84a', meta: '刚刚编辑' },
];
const initialEdges: Edge[] = [
  { from: 'script-01', to: 'character-01' }, { from: 'script-01', to: 'image-01' }, { from: 'character-01', to: 'video-01' }, { from: 'image-01', to: 'video-01' },
];
const palette = ['#ed6a5a', '#8a78ed', '#4d9de0', '#38b883', '#e1a84a'];
const kindLabel = (kind: NodeKind) => ({ script: 'SCRIPT', character: 'CHARACTER', image: 'IMAGE', video: 'VIDEO', note: 'NOTE' })[kind];
const kindIcon = (kind: NodeKind) => ({ script: 'S', character: '✦', image: '▧', video: '▶', note: '—' })[kind];

export default function Home() {
  const [nodes, setNodes] = useState<CanvasNode[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedId, setSelectedId] = useState('video-01');
  const [zoom, setZoom] = useState(0.82);
  const [pan, setPan] = useState({ x: 90, y: 72 });
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [isMiniMapOpen, setIsMiniMapOpen] = useState(true);
  const [saved, setSaved] = useState(true);
  const dragRef = useRef<DragState>(null);
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.mode === 'pan') setPan({ x: drag.panX + event.clientX - drag.x, y: drag.panY + event.clientY - drag.y });
      else {
        setNodes((current) => current.map((node) => node.id === drag.nodeId ? { ...node, x: drag.nodeX + (event.clientX - drag.x) / zoom, y: drag.nodeY + (event.clientY - drag.y) / zoom } : node));
        setSaved(false);
      }
    };
    const handleUp = () => { dragRef.current = null; document.body.style.cursor = ''; };
    window.addEventListener('pointermove', handleMove); window.addEventListener('pointerup', handleUp);
    return () => { window.removeEventListener('pointermove', handleMove); window.removeEventListener('pointerup', handleUp); };
  }, [zoom]);

  const startPan = (event: React.PointerEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    dragRef.current = { mode: 'pan', x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }; document.body.style.cursor = 'grabbing';
  };
  const startNodeDrag = (event: React.PointerEvent<HTMLElement>, node: CanvasNode) => {
    event.stopPropagation();
    if (isConnectMode) {
      setSelectedId(node.id);
      if (!connectFrom) setConnectFrom(node.id);
      else if (connectFrom !== node.id) {
        setEdges((current) => current.some((edge) => edge.from === connectFrom && edge.to === node.id) ? current : [...current, { from: connectFrom, to: node.id }]);
        setConnectFrom(null); setIsConnectMode(false); setSaved(false);
      }
      return;
    }
    setSelectedId(node.id); dragRef.current = { mode: 'node', nodeId: node.id, x: event.clientX, y: event.clientY, nodeX: node.x, nodeY: node.y }; document.body.style.cursor = 'grabbing';
  };
  const zoomAt = (nextZoom: number) => setZoom(Math.min(1.35, Math.max(0.45, Number(nextZoom.toFixed(2)))));
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => { event.preventDefault(); zoomAt(zoom + (event.deltaY > 0 ? -0.06 : 0.06)); };
  const addNode = (kind: NodeKind) => {
    const number = nodes.filter((node) => node.kind === kind).length + 1;
    const titles = { script: `新场景 · ${number}`, character: `新角色 · ${number}`, image: `新画面 · ${number}`, video: `新镜头 · ${number}`, note: `新笔记 · ${number}` };
    const newNode: CanvasNode = { id: `${kind}-${Date.now()}`, kind, x: 330 + (number % 3) * 74, y: 580 + (number % 2) * 68, title: titles[kind], subtitle: `${kindLabel(kind)} / ${String(number).padStart(2, '0')}`, body: kind === 'note' ? '记录你的创作意图……' : '点击右侧属性面板编辑内容。', accent: palette[number % palette.length], meta: '未保存' };
    setNodes((current) => [...current, newNode]); setSelectedId(newNode.id); setSaved(false);
  };
  const deleteSelected = () => {
    if (!selected) return;
    setNodes((current) => current.filter((node) => node.id !== selected.id)); setEdges((current) => current.filter((edge) => edge.from !== selected.id && edge.to !== selected.id));
    setSelectedId(nodes.find((node) => node.id !== selected.id)?.id ?? ''); setSaved(false);
  };
  const updateSelected = (field: 'title' | 'body', value: string) => { setNodes((current) => current.map((node) => node.id === selected?.id ? { ...node, [field]: value } : node)); setSaved(false); };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark" aria-hidden="true"><span /><span /><span /></div><span className="brand-name">frame<span>flow</span></span><span className="workspace-pill">STUDIO</span></div>
        <div className="project-name"><span className="live-dot" /> 雨夜之后 <span className="project-state">{saved ? '已保存' : '未保存'}</span></div>
        <div className="top-actions"><button className="icon-button" aria-label="搜索">⌕</button><button className="share-button">分享项目 <span>↗</span></button><button className="avatar">L</button></div>
      </header>

      <aside className="left-rail">
        <div className="rail-group"><button className="rail-button active" aria-label="画布"><span className="rail-glyph">⌘</span><small>画布</small></button><button className="rail-button" aria-label="资产"><span className="rail-glyph">◈</span><small>资产</small></button><button className="rail-button" aria-label="灵感"><span className="rail-glyph">✧</span><small>灵感</small></button></div>
        <div className="rail-divider" /><div className="rail-group"><button className="rail-button" aria-label="项目"><span className="rail-glyph">▤</span><small>项目</small></button><button className="rail-button" aria-label="团队"><span className="rail-glyph">♧</span><small>团队</small></button></div><button className="rail-button rail-bottom" aria-label="设置"><span className="rail-glyph">⚙</span><small>设置</small></button>
      </aside>

      <section className="canvas-stage" onPointerDown={startPan} onWheel={handleWheel} aria-label="无限画布">
        <div className="canvas-hint"><span>⌘</span> 拖动以移动画布 <i /> <span>滚轮</span> 缩放</div>
        <div className="canvas-world" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          <div className="world-label label-one">STORY DEVELOPMENT</div><div className="world-label label-two">VISUAL DIRECTION</div>
          <svg className="edges-layer" width="1800" height="1200" viewBox="0 0 1800 1200" aria-hidden="true"><defs><linearGradient id="edge-gradient" x1="0" x2="1"><stop offset="0%" stopColor="#ed6a5a" /><stop offset="100%" stopColor="#4d9de0" /></linearGradient></defs>
            {edges.map((edge) => { const from = nodeMap.get(edge.from); const to = nodeMap.get(edge.to); if (!from || !to) return null; const fromSize = nodeSize[from.kind]; const toSize = nodeSize[to.kind]; const x1 = from.x + fromSize.width; const y1 = from.y + fromSize.height / 2; const x2 = to.x; const y2 = to.y + toSize.height / 2; const curve = Math.max(92, Math.abs(x2 - x1) * 0.48); return <path key={`${edge.from}-${edge.to}`} className="edge-path" d={`M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`} />; })}
          </svg>
          {nodes.map((node) => <article key={node.id} className={`canvas-node node-${node.kind} ${selectedId === node.id ? 'selected' : ''} ${connectFrom === node.id ? 'connect-source' : ''}`} style={{ left: node.x, top: node.y, width: nodeSize[node.kind].width, minHeight: nodeSize[node.kind].height, ['--accent' as string]: node.accent }} onPointerDown={(event) => startNodeDrag(event, node)} onClick={() => setSelectedId(node.id)}>
            <div className="node-header"><div className="node-kind"><span className="kind-icon">{kindIcon(node.kind)}</span><span>{node.subtitle}</span></div><button className="node-menu" aria-label="节点菜单" onPointerDown={(event) => event.stopPropagation()}>···</button></div><h2>{node.title}</h2>
            {node.kind === 'image' ? <div className="node-visual image-visual"><div className="visual-sun" /><div className="visual-station" /><div className="visual-rain" /><span>雨夜 · 霓虹 · 35mm</span></div> : null}
            {node.kind === 'video' ? <div className="node-visual video-visual"><div className="video-play">▶</div><span>00:05</span><div className="video-scanline" /></div> : null}
            {node.kind === 'script' ? <div className="script-lines"><span /><span /><span /><span /></div> : null}
            {node.kind === 'character' ? <div className="character-avatar"><span>舟</span></div> : null}
            {node.body ? <p>{node.body}</p> : null}<div className="node-footer"><span>{node.meta}</span><span className="node-arrow">↗</span></div><span className="port port-left" /><span className="port port-right" />
          </article>)}
        </div>
        <div className="canvas-tools"><button className="tool-button primary" onClick={() => addNode('note')} aria-label="添加节点">＋</button><button className={`tool-button ${isConnectMode ? 'tool-active' : ''}`} onClick={() => { setIsConnectMode((value) => !value); setConnectFrom(null); }} aria-label="连接节点">⌁</button><button className="tool-button" onClick={() => addNode('image')} aria-label="添加图片">▧</button><button className="tool-button" onClick={() => addNode('video')} aria-label="添加视频">▶</button><div className="tool-divider" /><button className="tool-button" onClick={() => zoomAt(zoom - 0.1)} aria-label="缩小">−</button><span className="zoom-value">{Math.round(zoom * 100)}%</span><button className="tool-button" onClick={() => zoomAt(zoom + 0.1)} aria-label="放大">＋</button><button className="tool-button" onClick={() => { setPan({ x: 90, y: 72 }); setZoom(0.82); }} aria-label="回到中心">◎</button></div>
        <div className="status-chip"><span className="status-dot" /> 画布已同步</div>{isConnectMode ? <div className="connect-banner">连接模式：点击两个节点建立工作流 <button onClick={() => { setIsConnectMode(false); setConnectFrom(null); }}>完成</button></div> : null}
      </section>

      <aside className="inspector"><div className="inspector-top"><div><span className="eyebrow">INSPECTOR</span><h1>节点属性</h1></div><button className="close-inspector" aria-label="关闭属性面板">×</button></div>
        {selected ? <><div className="inspector-type"><span className="large-kind-icon" style={{ color: selected.accent }}>{kindIcon(selected.kind)}</span><div><strong>{kindLabel(selected.kind)}</strong><small>{selected.subtitle}</small></div><button className="more-button">···</button></div><label className="field-label">标题<input value={selected.title} onChange={(event) => updateSelected('title', event.target.value)} /></label><label className="field-label">内容<textarea value={selected.body ?? ''} onChange={(event) => updateSelected('body', event.target.value)} rows={5} /></label>
          {selected.kind === 'video' ? <div className="setting-row"><div><span className="field-label">生成模型</span><strong>Seedance 2.5</strong></div><span className="select-chevron">⌄</span></div> : null}<div className="setting-row"><div><span className="field-label">参考节点</span><strong>{edges.filter((edge) => edge.to === selected.id || edge.from === selected.id).length} 个已连接</strong></div><span className="link-icon">⌁</span></div><div className="inspector-section"><div className="section-heading"><span>生成记录</span><button>查看全部</button></div><div className="history-card"><div className="history-thumb"><span>✦</span></div><div><strong>画面探索 · v4</strong><small>今天 14:32 · 已完成</small></div><span className="history-arrow">↗</span></div></div><div className="inspector-footer"><button className="delete-button" onClick={deleteSelected}>删除节点</button><button className="duplicate-button" onClick={() => addNode(selected.kind)}>复制节点</button></div></> : <div className="empty-inspector">选择一个节点开始编辑</div>}
      </aside>

      <div className={`minimap ${isMiniMapOpen ? '' : 'minimap-closed'}`}><div className="minimap-head"><span>画布概览</span><button onClick={() => setIsMiniMapOpen((value) => !value)}>{isMiniMapOpen ? '−' : '+'}</button></div>{isMiniMapOpen ? <div className="minimap-map"><span className="mini-line line-a" /><span className="mini-line line-b" /><span className="mini-node mini-script" /><span className="mini-node mini-character" /><span className="mini-node mini-image" /><span className="mini-node mini-video" /><span className="mini-node mini-note" /><div className="mini-viewport" /></div> : null}</div>
    </main>
  );
}
