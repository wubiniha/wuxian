'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type NodeKind = 'script' | 'character' | 'image' | 'video' | 'voice' | 'note';
type CanvasNode = { id: string; kind: NodeKind; x: number; y: number; title: string; subtitle: string; body?: string; accent: string; meta?: string; assetId?: string; assetUrl?: string };
type Edge = { from: string; to: string };
type ModelOption = { value: string; label: string };
type AssetOption = { id: string; name: string; kind: string; url: string | null };
type DragState =
  | { mode: 'pan'; x: number; y: number; panX: number; panY: number }
  | { mode: 'node'; nodeId: string; x: number; y: number; nodeX: number; nodeY: number }
  | null;

const nodeSize: Record<NodeKind, { width: number; height: number }> = {
  script: { width: 320, height: 235 }, character: { width: 278, height: 228 }, image: { width: 300, height: 248 }, video: { width: 318, height: 256 }, voice: { width: 290, height: 210 }, note: { width: 264, height: 190 },
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
const kindLabel = (kind: NodeKind) => ({ script: 'SCRIPT', character: 'CHARACTER', image: 'IMAGE', video: 'VIDEO', voice: 'VOICE', note: 'TEXT' })[kind];
const kindIcon = (kind: NodeKind) => ({ script: 'S', character: '✦', image: '▧', video: '▶', voice: '♫', note: 'T' })[kind];
const videoModelOptions: ModelOption[] = [
  { value: 'openrouter::bytedance/seedance-2.5', label: 'Seedance 2.5' },
  { value: 'openrouter::alibaba/wan-3.0', label: 'Wan 3.0' },
  { value: 'openrouter::bytedance/seedance-2.0-mini', label: 'Seedance 2.0 Mini' },
];
const imageModelOptions: ModelOption[] = [
  { value: 'ark::doubao-seedream-5-0-260128', label: 'Seedream 5.0 Lite' },
  { value: 'ark::doubao-seedream-4-5-251128', label: 'Seedream 4.5' },
  { value: 'ark::doubao-seedream-4-0-250828', label: 'Seedream 4.0' },
];
const voiceModelOptions: ModelOption[] = [
  { value: 'mimo::mimo-v2.5-tts', label: 'MiMo TTS' },
  { value: 'mimo::mimo-v2.5-tts-voicedesign', label: 'MiMo Voice Design' },
  { value: 'mimo::mimo-v2.5-tts-voiceclone', label: 'MiMo Voice Clone' },
];
const textModelOptions: ModelOption[] = [
  { value: 'openrouter::openai/gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'openrouter::google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
];

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
  const [videoModels, setVideoModels] = useState(videoModelOptions);
  const [imageModels, setImageModels] = useState(imageModelOptions);
  const [voiceModels, setVoiceModels] = useState(voiceModelOptions);
  const [textModels, setTextModels] = useState(textModelOptions);
  const [selectedVideoModel, setSelectedVideoModel] = useState(videoModelOptions[0].value);
  const [selectedImageModel, setSelectedImageModel] = useState(imageModelOptions[0].value);
  const [selectedVoiceModel, setSelectedVoiceModel] = useState(voiceModelOptions[0].value);
  const [selectedTextModel, setSelectedTextModel] = useState(textModelOptions[0].value);
  const [assetPanelOpen, setAssetPanelOpen] = useState(false);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [connectionMessage, setConnectionMessage] = useState('本地画布');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsKind, setSettingsKind] = useState<'text' | 'image' | 'voice' | 'video'>('video');
  const [newModelName, setNewModelName] = useState('');
  const [newModelId, setNewModelId] = useState('');
  const dragRef = useRef<DragState>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem('wuxian-canvas-state-v1');
        if (stored) {
          const state = JSON.parse(stored) as { nodes?: CanvasNode[]; edges?: Edge[]; pan?: { x: number; y: number }; zoom?: number; assets?: AssetOption[]; videoModels?: ModelOption[]; imageModels?: ModelOption[]; voiceModels?: ModelOption[]; textModels?: ModelOption[] };
          if (Array.isArray(state.nodes) && state.nodes.length > 0) { setNodes(state.nodes); setSelectedId(state.nodes[0].id); }
          if (Array.isArray(state.edges)) setEdges(state.edges);
          if (state.pan) setPan(state.pan);
          if (typeof state.zoom === 'number') setZoom(state.zoom);
          if (Array.isArray(state.assets)) setAssets(state.assets);
          if (Array.isArray(state.videoModels) && state.videoModels.length > 0) setVideoModels(state.videoModels);
          if (Array.isArray(state.imageModels) && state.imageModels.length > 0) setImageModels(state.imageModels);
          if (Array.isArray(state.voiceModels) && state.voiceModels.length > 0) setVoiceModels(state.voiceModels);
          if (Array.isArray(state.textModels) && state.textModels.length > 0) setTextModels(state.textModels);
        }
      } catch { setConnectionMessage('本地画布 · 草稿恢复失败'); }
      setIsHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem('wuxian-canvas-state-v1', JSON.stringify({ nodes, edges, pan, zoom, assets, videoModels, imageModels, voiceModels, textModels }));
    const timer = window.setTimeout(() => setSaved(true), 0);
    return () => window.clearTimeout(timer);
  }, [assets, edges, imageModels, isHydrated, nodes, pan, textModels, videoModels, voiceModels, zoom]);

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
    setSelectedId(node.id); dragRef.current = { mode: 'node', nodeId: node.id, x: event.clientX, y: event.clientY, nodeX: node.x, nodeY: node.y };
  };
  const zoomAt = (nextZoom: number) => setZoom(Math.min(1.35, Math.max(0.45, Number(nextZoom.toFixed(2)))));
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => { event.preventDefault(); zoomAt(zoom + (event.deltaY > 0 ? -0.06 : 0.06)); };
  const addNode = (kind: NodeKind) => {
    const number = nodes.filter((node) => node.kind === kind).length + 1;
    const titles = { script: `新场景 · ${number}`, character: `新角色 · ${number}`, image: `新画面 · ${number}`, video: `新镜头 · ${number}`, voice: `新配音 · ${number}`, note: `新文字 · ${number}` };
    const newNode: CanvasNode = { id: `${kind}-${Date.now()}`, kind, x: 330 + (number % 3) * 74, y: 580 + (number % 2) * 68, title: titles[kind], subtitle: `${kindLabel(kind)} / ${String(number).padStart(2, '0')}`, body: kind === 'note' ? '记录你的创作意图……' : '点击右侧属性面板编辑内容。', accent: palette[number % palette.length], meta: '未保存' };
    setNodes((current) => [...current, newNode]); setSelectedId(newNode.id); setSaved(false);
  };
  const deleteSelected = () => {
    if (!selected) return;
    setNodes((current) => current.filter((node) => node.id !== selected.id)); setEdges((current) => current.filter((edge) => edge.from !== selected.id && edge.to !== selected.id));
    setSelectedId(nodes.find((node) => node.id !== selected.id)?.id ?? ''); setSaved(false);
  };
  const updateSelected = (field: 'title' | 'body', value: string) => { setNodes((current) => current.map((node) => node.id === selected?.id ? { ...node, [field]: value } : node)); setSaved(false); };
  const handleAssetUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => {
      if (file.size > 8 * 1024 * 1024) { setConnectionMessage('单个素材请控制在 8MB 以内'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const asset: AssetOption = { id: `local-${Date.now()}-${file.name}`, name: file.name, kind: file.type.split('/')[0] || 'asset', url: typeof reader.result === 'string' ? reader.result : null };
        setAssets((current) => [asset, ...current]); setConnectionMessage('素材已加入本地资产库');
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };
  const addAssetNode = (asset: AssetOption) => {
    const newNode: CanvasNode = { id: `asset-${asset.id}-node`, kind: 'image', x: 360 + (nodes.length % 3) * 90, y: 560 + (nodes.length % 2) * 70, title: asset.name, subtitle: `ASSET / ${asset.kind.toUpperCase()}`, body: '来自本地资产库，可作为图片或视频节点参考。', assetId: asset.id, assetUrl: asset.url || undefined, accent: '#4d9de0', meta: '资产引用' };
    setNodes((current) => [...current, newNode]); setSelectedId(newNode.id); setAssetPanelOpen(false); setSaved(false);
  };
  const modelListFor = (kind: 'text' | 'image' | 'voice' | 'video') => kind === 'video' ? videoModels : kind === 'image' ? imageModels : kind === 'voice' ? voiceModels : textModels;
  const addCustomModel = () => {
    const name = newModelName.trim(); const id = newModelId.trim();
    if (!name || !id) { setConnectionMessage('请填写模型名称和模型 ID'); return; }
    const option = { label: name, value: id };
    if (settingsKind === 'video') setVideoModels((current) => [...current, option]);
    if (settingsKind === 'image') setImageModels((current) => [...current, option]);
    if (settingsKind === 'voice') setVoiceModels((current) => [...current, option]);
    if (settingsKind === 'text') setTextModels((current) => [...current, option]);
    setNewModelName(''); setNewModelId(''); setConnectionMessage(`${name} 已加入${settingsKind === 'video' ? '视频' : settingsKind === 'image' ? '图片' : settingsKind === 'voice' ? '语音' : '文字'}模型`);
  };
  const runSelected = async () => {
    if (!selected) return;
    if (selected.kind !== 'video') { setConnectionMessage('当前只有视频节点支持调用模型'); return; }
    setIsRunning(true); setNodes((current) => current.map((node) => node.id === selected.id ? { ...node, meta: '生成中……' } : node));
    try {
      const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: selectedVideoModel.replace('openrouter::', ''), prompt: selected.body || '', duration: 5, resolution: '480p', aspectRatio: '16:9', generateAudio: true, references: selected.assetUrl ? [selected.assetUrl] : [] }) });
      const payload = await response.json().catch(() => ({})) as { message?: string; jobId?: string };
      if (!response.ok) throw new Error(payload.message || '模型调用失败');
      setConnectionMessage(`已提交 · ${payload.jobId || '等待返回'}`); setNodes((current) => current.map((node) => node.id === selected.id ? { ...node, meta: '已提交任务' } : node));
    } catch (error) { setConnectionMessage(error instanceof Error ? error.message : '模型调用失败'); setNodes((current) => current.map((node) => node.id === selected.id ? { ...node, meta: '运行失败' } : node)); }
    finally { setIsRunning(false); }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark" aria-hidden="true"><span /><span /><span /></div><span className="brand-name">frame<span>flow</span></span><span className="workspace-pill">STUDIO</span></div>
        <div className="project-name"><span className="live-dot" /><strong>未命名工作区</strong><span className="project-state">{saved ? connectionMessage : '未保存'}</span></div>
        <div className="top-actions"><button className="icon-button" aria-label="设置" onClick={() => setSettingsOpen(true)}>⚙</button><button className="share-button">导出 JSON <span>↗</span></button><button className="avatar">W</button></div>
      </header>

      <aside className="left-rail">
        <div className="rail-group"><button className="rail-button active" aria-label="画布"><span className="rail-glyph">⌘</span><small>画布</small></button><button className={`rail-button ${assetPanelOpen ? 'active' : ''}`} aria-label="资产" onClick={() => setAssetPanelOpen((value) => !value)}><span className="rail-glyph">◈</span><small>资产</small></button><button className="rail-button" aria-label="灵感"><span className="rail-glyph">✧</span><small>灵感</small></button></div>
        <div className="rail-divider" /><div className="rail-group"><button className="rail-button" aria-label="项目"><span className="rail-glyph">▤</span><small>项目</small></button><button className="rail-button" aria-label="模板"><span className="rail-glyph">♧</span><small>模板</small></button></div><button className="rail-button rail-bottom" aria-label="设置" onClick={() => setSettingsOpen(true)}><span className="rail-glyph">⚙</span><small>设置</small></button>
      </aside>

      {assetPanelOpen ? <aside className="asset-drawer"><div className="drawer-head"><div><span className="eyebrow">ASSET LIBRARY</span><h2>本地资产库</h2></div><button onClick={() => setAssetPanelOpen(false)} aria-label="关闭资产库">×</button></div><p className="drawer-tip">素材只保存在当前浏览器。点击素材即可创建引用节点。</p><input ref={uploadRef} type="file" accept="image/*,video/*,audio/*" multiple hidden onChange={handleAssetUpload} /><button className="upload-asset-button" onClick={() => uploadRef.current?.click()}>＋ 上传素材</button><div className="asset-list">{assets.length > 0 ? assets.map((asset) => <button key={asset.id} className="asset-item" onClick={() => addAssetNode(asset)}>{asset.url ? <img src={asset.url} alt="" /> : <span className="asset-placeholder">◈</span>}<span><strong>{asset.name}</strong><small>{asset.kind}</small></span><b>＋</b></button>) : <div className="asset-empty">暂无素材<br /><small>上传图片、视频或音频后从这里调用</small></div>}</div></aside> : null}

      <section className="canvas-stage" onPointerDown={startPan} onWheel={handleWheel} aria-label="无限画布">
        <div className="canvas-hint"><span>⌘</span> 拖动以移动画布 <i /> <span>滚轮</span> 缩放</div>
        <div className="canvas-world" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          <div className="world-label label-one">STORY DEVELOPMENT</div><div className="world-label label-two">VISUAL DIRECTION</div>
          <svg className="edges-layer" width="1800" height="1200" viewBox="0 0 1800 1200" aria-hidden="true"><defs><linearGradient id="edge-gradient" x1="0" x2="1"><stop offset="0%" stopColor="#ed6a5a" /><stop offset="100%" stopColor="#4d9de0" /></linearGradient></defs>
            {edges.map((edge) => { const from = nodeMap.get(edge.from); const to = nodeMap.get(edge.to); if (!from || !to) return null; const fromSize = nodeSize[from.kind]; const toSize = nodeSize[to.kind]; const x1 = from.x + fromSize.width; const y1 = from.y + fromSize.height / 2; const x2 = to.x; const y2 = to.y + toSize.height / 2; const curve = Math.max(92, Math.abs(x2 - x1) * 0.48); return <path key={`${edge.from}-${edge.to}`} className="edge-path" d={`M ${x1} ${y1} C ${x1 + curve} ${y1}, ${x2 - curve} ${y2}, ${x2} ${y2}`} />; })}
          </svg>
          {nodes.map((node) => <article key={node.id} className={`canvas-node node-${node.kind} ${selectedId === node.id ? 'selected' : ''} ${connectFrom === node.id ? 'connect-source' : ''}`} style={{ left: node.x, top: node.y, width: nodeSize[node.kind].width, minHeight: nodeSize[node.kind].height, ['--accent' as string]: node.accent }} onPointerDown={(event) => startNodeDrag(event, node)} onClick={() => setSelectedId(node.id)}>
            <div className="node-header"><div className="node-kind"><span className="kind-icon">{kindIcon(node.kind)}</span><span>{node.subtitle}</span></div><button className="node-menu" aria-label="节点菜单" onPointerDown={(event) => event.stopPropagation()}>···</button></div><h2>{node.title}</h2>
            {node.kind === 'image' ? <div className="node-visual image-visual">{node.assetUrl ? <img src={node.assetUrl} alt="" className="asset-node-image" /> : <><div className="visual-sun" /><div className="visual-station" /><div className="visual-rain" /><span>雨夜 · 霓虹 · 35mm</span></>}</div> : null}
            {node.kind === 'video' ? <div className="node-visual video-visual"><div className="video-play">▶</div><span>00:05</span><div className="video-scanline" /></div> : null}
            {node.kind === 'script' ? <div className="script-lines"><span /><span /><span /><span /></div> : null}
            {node.kind === 'character' ? <div className="character-avatar"><span>舟</span></div> : null}
            {node.body ? <p>{node.body}</p> : null}<div className="node-footer"><span>{node.meta}</span><span className="node-arrow">↗</span></div><span className="port port-left" /><span className="port port-right" />
          </article>)}
        </div>
        <div className="canvas-tools"><button className="tool-button primary" onClick={() => addNode('note')} aria-label="添加文字">＋</button><button className={`tool-button ${isConnectMode ? 'tool-active' : ''}`} onClick={() => { setIsConnectMode((value) => !value); setConnectFrom(null); }} aria-label="连接节点">⌁</button><button className="tool-button" onClick={() => addNode('image')} aria-label="添加图片">▧</button><button className="tool-button" onClick={() => addNode('video')} aria-label="添加视频">▶</button><button className="tool-button" onClick={() => addNode('voice')} aria-label="添加语音">♫</button><div className="tool-divider" /><button className="tool-button" onClick={() => zoomAt(zoom - 0.1)} aria-label="缩小">−</button><span className="zoom-value">{Math.round(zoom * 100)}%</span><button className="tool-button" onClick={() => zoomAt(zoom + 0.1)} aria-label="放大">＋</button><button className="tool-button" onClick={() => { setPan({ x: 90, y: 72 }); setZoom(0.82); }} aria-label="回到中心">◎</button></div>
        <div className="status-chip"><span className="status-dot" /> 画布已同步</div>{isConnectMode ? <div className="connect-banner">连接模式：点击两个节点建立工作流 <button onClick={() => { setIsConnectMode(false); setConnectFrom(null); }}>完成</button></div> : null}
      </section>

      <aside className="inspector"><div className="inspector-top"><div><span className="eyebrow">INSPECTOR</span><h1>节点属性</h1></div><button className="close-inspector" aria-label="关闭属性面板">×</button></div>
        {selected ? <><div className="inspector-type"><span className="large-kind-icon" style={{ color: selected.accent }}>{kindIcon(selected.kind)}</span><div><strong>{kindLabel(selected.kind)}</strong><small>{selected.subtitle}</small></div><button className="more-button">···</button></div><label className="field-label">标题<input value={selected.title} onChange={(event) => updateSelected('title', event.target.value)} /></label><label className="field-label">内容<textarea value={selected.body ?? ''} onChange={(event) => updateSelected('body', event.target.value)} rows={5} /></label>
          {selected.kind === 'video' ? <div className="setting-row"><div><span className="field-label">生成模型</span><select aria-label="视频模型" value={selectedVideoModel} onChange={(event) => { setSelectedVideoModel(event.target.value); setSaved(false); }}>{videoModels.map((model) => <option key={model.value} value={model.value}>{model.label}</option>)}</select></div><span className="select-chevron">⌄</span></div> : null}{selected.kind === 'image' ? <div className="setting-row"><div><span className="field-label">图片模型</span><select aria-label="图片模型" value={selectedImageModel} onChange={(event) => { setSelectedImageModel(event.target.value); setSaved(false); }}>{imageModels.map((model) => <option key={model.value} value={model.value}>{model.label}</option>)}</select></div><span className="select-chevron">⌄</span></div> : null}{selected.kind === 'voice' ? <div className="setting-row"><div><span className="field-label">语音模型</span><select aria-label="语音模型" value={selectedVoiceModel} onChange={(event) => { setSelectedVoiceModel(event.target.value); setSaved(false); }}>{voiceModels.map((model) => <option key={model.value} value={model.value}>{model.label}</option>)}</select></div><span className="select-chevron">⌄</span></div> : null}{selected.kind === 'script' || selected.kind === 'note' ? <div className="setting-row"><div><span className="field-label">文字模型</span><select aria-label="文字模型" value={selectedTextModel} onChange={(event) => { setSelectedTextModel(event.target.value); setSaved(false); }}>{textModels.map((model) => <option key={model.value} value={model.value}>{model.label}</option>)}</select></div><span className="select-chevron">⌄</span></div> : null}<div className="setting-row"><div><span className="field-label">参考节点</span><strong>{edges.filter((edge) => edge.to === selected.id || edge.from === selected.id).length} 个已连接</strong></div><span className="link-icon">⌁</span></div><div className="inspector-section"><div className="section-heading"><span>生成记录</span><button>查看全部</button></div><div className="history-card"><div className="history-thumb"><span>✦</span></div><div><strong>画面探索 · v4</strong><small>今天 14:32 · 已完成</small></div><span className="history-arrow">↗</span></div></div><div className="inspector-footer"><button className="run-button" onClick={() => void runSelected()} disabled={isRunning}>{isRunning ? '生成中…' : selected.kind === 'video' ? '运行节点' : '视频节点运行'}</button><button className="delete-button" onClick={deleteSelected}>删除节点</button><button className="duplicate-button" onClick={() => addNode(selected.kind)}>复制节点</button></div></> : <div className="empty-inspector">选择一个节点开始编辑</div>}
      </aside>

      <div className={`minimap ${isMiniMapOpen ? '' : 'minimap-closed'}`}><div className="minimap-head"><span>画布概览</span><button onClick={() => setIsMiniMapOpen((value) => !value)}>{isMiniMapOpen ? '−' : '+'}</button></div>{isMiniMapOpen ? <div className="minimap-map"><span className="mini-line line-a" /><span className="mini-line line-b" /><span className="mini-node mini-script" /><span className="mini-node mini-character" /><span className="mini-node mini-image" /><span className="mini-node mini-video" /><span className="mini-node mini-note" /><div className="mini-viewport" /></div> : null}</div>
      {settingsOpen ? <div className="settings-backdrop" onClick={() => setSettingsOpen(false)}><aside className="settings-panel" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">MODEL SETTINGS</span><h2>模型与节点设置</h2></div><button onClick={() => setSettingsOpen(false)} aria-label="关闭设置">×</button></div><p className="drawer-tip">独立项目配置，密钥只在服务端使用，不会写入画布数据。</p><div className="settings-tabs">{(['video', 'image', 'voice', 'text'] as const).map((kind) => <button key={kind} className={settingsKind === kind ? 'active' : ''} onClick={() => setSettingsKind(kind)}>{kind === 'video' ? '视频' : kind === 'image' ? '图片' : kind === 'voice' ? '语音' : '文字'}</button>)}</div><div className="model-list">{modelListFor(settingsKind).map((model) => <div className="model-row" key={model.value}><span className="model-kind-icon">{settingsKind === 'video' ? '▶' : settingsKind === 'image' ? '▧' : settingsKind === 'voice' ? '♫' : 'T'}</span><div><strong>{model.label}</strong><small>{model.value}</small></div><span className="model-check">✓</span></div>)}</div><div className="custom-model-form"><span className="field-label">添加自定义模型</span><input aria-label="模型名称" value={newModelName} onChange={(event) => setNewModelName(event.target.value)} placeholder="显示名称" /><input aria-label="模型 ID" value={newModelId} onChange={(event) => setNewModelId(event.target.value)} placeholder="provider::model-id" /><button onClick={addCustomModel}>添加模型</button></div><div className="settings-note">视频默认开放：Seedance 2.5、Wan 3.0、Seedance 2.0 Mini。自定义模型需要对应服务端接口支持。</div></aside></div> : null}
    </main>
  );
}
