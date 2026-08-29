'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import type { CanvasNode, ModelConfig } from '../../lib/canvas/types';

type Props = {
  node: CanvasNode | null;
  models: ModelConfig[];
  connected: string[];
  anchor?: { x: number; y: number } | null;
  onChange: (patch: Partial<CanvasNode['data']>) => void;
  onRun: () => void;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

type OpenPanel = 'model' | 'mode' | 'params' | 'more' | null;
const labelMap = { text: '文字', image: '图片', video: '视频', audio: '语音', asset: '资产' } as const;

function ChoiceButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" className={active ? 'choice-button active' : 'choice-button'} onClick={onClick}>{children}</button>;
}

export function Workbench({ node, models, connected, anchor, onChange, onRun, onClose, onDelete, onDuplicate }: Props) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  if (!node) return null;
  const data = node.data;
  const config = data.config;
  const typeModels = models.filter((model) => model.type === (data.type === 'asset' ? 'image' : data.type));
  const currentModel = typeModels.find((model) => model.id === config.modelId) ?? typeModels[0];
  const cap = currentModel?.capability;
  const setConfig = (key: string, value: unknown) => onChange({ config: { ...config, [key]: value } });
  const field = (key: string, fallback = '') => String(config[key] ?? fallback);
  const numberField = (key: string, fallback: number) => Number(config[key] ?? fallback);
  const modes = cap?.modes ?? (data.type === 'image' ? ['图生图', '文生图'] : data.type === 'video' ? ['全能参考', '图生视频', '首尾帧'] : data.type === 'audio' ? ['文本转语音', '音色设计', '音色克隆'] : ['文本生成']);
  const mode = field('mode', modes[0]);
  const summary = data.type === 'video'
    ? `${field('aspectRatio', '16:9')} · ${field('resolution', '720p').toUpperCase()} · ${numberField('duration', 5)}s · ${numberField('count', 1)}个 · ${config.generateAudio ? '♫' : '静音'}`
    : data.type === 'image'
      ? `${field('aspectRatio', '16:9')} · ${field('resolution', '2K')} · ${numberField('count', 1)}张`
      : data.type === 'audio'
        ? `${field('language', '中文')} · ${field('format', 'wav').toUpperCase()} · ${numberField('sampleRate', 24000) / 1000}kHz`
        : `${numberField('maxTokens', 1200)} tokens · T ${numberField('temperature', 0.7)}`;
  const anchorStyle = anchor ? { '--workbench-x': `${anchor.x}px`, '--workbench-y': `${anchor.y}px` } as CSSProperties : undefined;

  if (data.type === 'asset') {
    return <section className="workbench lib-workbench asset-console" style={anchorStyle}>
      <button className="console-expand" type="button" title="收起工作台" onClick={onClose}>↙</button>
      <div className="asset-workbench">
        <div className="asset-workbench-preview">{data.assetUrl ? <img src={data.assetUrl} alt="" /> : '◈'}</div>
        <div><span className="console-kicker">已选资产</span><strong>{data.label}</strong><p>可连接到图片、视频或语音节点，作为生成参考。</p><span className="chip">{labelMap[data.assetKind ?? 'image']}</span></div>
      </div>
      <div className="asset-console-actions"><button type="button" onClick={onDuplicate}>⧉ 复制</button><button type="button" className="danger-link" onClick={onDelete}>删除</button></div>
    </section>;
  }

  return <section className="workbench lib-workbench" style={anchorStyle}>
    <button className="console-expand" type="button" title="收起工作台" onClick={onClose}>↙</button>
    <div className="workbench-toolbar">
      <button type="button">＋ 参考</button><button type="button">⌖ 标记</button><button type="button">▣ 特效</button><button type="button">♙ 角色库</button><button type="button">▭ 运镜</button>
    </div>
    {connected.length ? <div className="reference-strip">{connected.slice(0, 5).map((item, index) => <span className="reference-thumb" key={`${item}-${index}`}><i>{index + 1}</i>{item.slice(0, 1)}</span>)}</div> : null}
    <textarea className="workbench-prompt" value={data.body} onChange={(event) => onChange({ body: event.target.value })} placeholder={data.type === 'audio' ? '输入要合成的文字内容…' : '描述你想要生成的内容，@ 引用素材'} />

    <div className="console-bottom">
      <div className="console-select-wrap model-select-wrap">
        <button type="button" className={openPanel === 'model' ? 'console-pill active' : 'console-pill'} onClick={() => setOpenPanel(openPanel === 'model' ? null : 'model')}><b className="model-wave">▥</b><strong>{currentModel?.name ?? '选择模型'}</strong><span>◆</span><small>⌄</small></button>
        {openPanel === 'model' ? <div className="console-popover model-popover"><span className="popover-title">选择生成模型</span>{typeModels.length ? typeModels.map((model) => <button type="button" key={model.id} className={model.id === currentModel?.id ? 'model-option selected' : 'model-option'} onClick={() => { setConfig('modelId', model.id); setOpenPanel(null); }}><span className="model-option-icon">{model.type === 'video' ? '▥' : model.type === 'image' ? '▧' : model.type === 'audio' ? '♫' : 'T'}</span><span><b>{model.name}</b><small>{model.provider} · {model.type === 'video' ? '视频生成' : model.type === 'image' ? '图片生成' : model.type === 'audio' ? '语音生成' : '文字生成'}</small></span>{model.enabled ? <em>可用</em> : null}</button>) : <div className="popover-empty">请先到设置中心添加模型</div>}</div> : null}
      </div>

      <div className="console-select-wrap">
        <button type="button" className={openPanel === 'mode' ? 'console-pill active' : 'console-pill'} onClick={() => setOpenPanel(openPanel === 'mode' ? null : 'mode')}><b>◫</b><strong>{mode}</strong><small>⌄</small></button>
        {openPanel === 'mode' ? <div className="console-popover mode-popover"><span className="popover-title">{data.type === 'video' ? '视频生成模式' : '生成模式'}</span>{modes.map((item) => <button type="button" className={item === mode ? 'mode-option selected' : 'mode-option'} key={item} onClick={() => { setConfig('mode', item); setOpenPanel(null); }}><span>{item === '全能参考' ? '◫' : item === '图生视频' || item === '图生图' ? '▧' : item === '首尾帧' ? '♧' : '✦'}</span><b>{item}</b>{item === mode ? <i>✓</i> : null}</button>)}</div> : null}
      </div>

      <div className="console-select-wrap params-select-wrap">
        <button type="button" className={openPanel === 'params' ? 'console-pill params-pill active' : 'console-pill params-pill'} onClick={() => setOpenPanel(openPanel === 'params' ? null : 'params')}><b>▭</b><strong>{summary}</strong><small>⌄</small></button>
        {openPanel === 'params' ? <div className="console-popover params-popover">
          {data.type === 'video' ? <>
            <span className="param-section-title">比例</span><div className="ratio-grid">{(cap?.aspectRatios ?? ['Auto', '16:9', '4:3', '1:1', '3:4', '9:16', '21:9']).map((item) => <ChoiceButton key={item} active={field('aspectRatio', '16:9') === item} onClick={() => setConfig('aspectRatio', item)}><i className={`ratio-icon ratio-${item.replace(':', '-')}`} />{item}</ChoiceButton>)}</div>
            <span className="param-section-title">清晰度</span><div className="segmented-grid">{(cap?.resolutions ?? ['480p', '720p', '1080p']).map((item) => <ChoiceButton key={item} active={field('resolution', '720p') === item} onClick={() => setConfig('resolution', item)}>{item.toUpperCase()}</ChoiceButton>)}</div>
            <span className="param-section-title row-title">视频时长 <output>{numberField('duration', 5)} s</output></span><input className="console-range" type="range" min={Math.min(...(cap?.durations ?? [3, 5]))} max={Math.max(...(cap?.durations ?? [5, 30]))} step="1" value={numberField('duration', 5)} onChange={(event) => setConfig('duration', Number(event.target.value))} />
            <span className="param-section-title">生成音频</span><div className="segmented-grid two">{[true, false].map((item) => <ChoiceButton key={String(item)} active={Boolean(config.generateAudio) === item} onClick={() => setConfig('generateAudio', item)}>{item ? '开启' : '关闭'}</ChoiceButton>)}</div>
            <span className="param-section-title">生成数量</span><div className="segmented-grid">{(cap?.counts ?? [1, 2, 4]).map((item) => <ChoiceButton key={item} active={numberField('count', 1) === item} onClick={() => setConfig('count', item)}>{item}个</ChoiceButton>)}</div>
          </> : null}
          {data.type === 'image' ? <>
            <span className="param-section-title">分辨率</span><div className="segmented-grid two">{(cap?.resolutions ?? ['1K', '2K']).map((item) => <ChoiceButton key={item} active={field('resolution', '2K') === item} onClick={() => setConfig('resolution', item)}>{item}</ChoiceButton>)}</div>
            <span className="param-section-title">比例</span><div className="ratio-grid image-ratios">{(cap?.aspectRatios ?? ['1:1', '9:16', '16:9', '3:4', '4:3']).map((item) => <ChoiceButton key={item} active={field('aspectRatio', '16:9') === item} onClick={() => setConfig('aspectRatio', item)}><i className={`ratio-icon ratio-${item.replace(':', '-')}`} />{item}</ChoiceButton>)}</div>
            <span className="param-section-title">生成数量</span><div className="segmented-grid">{(cap?.counts ?? [1, 2, 4]).map((item) => <ChoiceButton key={item} active={numberField('count', 1) === item} onClick={() => setConfig('count', item)}>{item}张</ChoiceButton>)}</div>
          </> : null}
          {data.type === 'audio' ? <>
            <span className="param-section-title">语言</span><div className="segmented-grid two">{(cap?.languages ?? ['中文', 'English']).map((item) => <ChoiceButton key={item} active={field('language', '中文') === item} onClick={() => setConfig('language', item)}>{item}</ChoiceButton>)}</div>
            <span className="param-section-title">格式</span><div className="segmented-grid two">{(cap?.formats ?? ['wav', 'mp3']).map((item) => <ChoiceButton key={item} active={field('format', 'wav') === item} onClick={() => setConfig('format', item)}>{item.toUpperCase()}</ChoiceButton>)}</div>
            <span className="param-section-title row-title">速度 <output>{numberField('speed', 1).toFixed(1)}×</output></span><input className="console-range" type="range" min="0.5" max="2" step="0.1" value={numberField('speed', 1)} onChange={(event) => setConfig('speed', Number(event.target.value))} />
          </> : null}
          {data.type === 'text' ? <><label className="console-field">系统提示词<textarea value={field('system')} onChange={(event) => setConfig('system', event.target.value)} placeholder="定义模型角色与输出格式" /></label><div className="console-fields"><label>最大输出<input type="number" min="100" value={numberField('maxTokens', 1200)} onChange={(event) => setConfig('maxTokens', Number(event.target.value))} /></label><label>温度<input type="number" min="0" max="2" step="0.1" value={numberField('temperature', 0.7)} onChange={(event) => setConfig('temperature', Number(event.target.value))} /></label></div></> : null}
        </div> : null}
      </div>

      <div className="console-spacer" />
      <button type="button" className="console-icon-button" title="复制节点" onClick={onDuplicate}>▤</button>
      <button type="button" className="console-icon-button" title="更多设置" onClick={() => setOpenPanel(openPanel === 'more' ? null : 'more')}>☷</button>
      {openPanel === 'more' ? <div className="console-popover more-popover"><button type="button" onClick={onDuplicate}>⧉ 复制节点</button><button type="button" className="danger-link" onClick={onDelete}>⌫ 删除节点</button></div> : null}
      <span className="credit-hint">⚡ {data.type === 'video' ? '135' : data.type === 'image' ? '14' : '8'}</span>
      <button type="button" className="run-orb" onClick={onRun} disabled={data.status === 'running' || data.status === 'queued'} title="运行节点">{data.status === 'running' || data.status === 'queued' ? '…' : '↑'}</button>
    </div>
    {data.error ? <div className="console-error">{data.error}</div> : null}
  </section>;
}
