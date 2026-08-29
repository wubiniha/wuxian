'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { NODE_DEFINITIONS } from '../../lib/canvas/registry';
import type { CanvasNode } from '../../lib/canvas/types';

const statusLabel = { idle: '待运行', queued: '排队中', running: '生成中', success: '已完成', failed: '失败' } as const;

export function CanvasCard({ data, selected }: NodeProps<CanvasNode>) {
  const definition = NODE_DEFINITIONS[data.type];
  return (
    <div className={`canvas-card ${selected ? 'is-selected' : ''}`} style={{ '--node-accent': data.accent } as React.CSSProperties}>
      {definition.inputs.map((port, index) => (
        <Handle key={port.id} type="target" position={Position.Left} id={port.id} style={{ top: `${34 + index * 24}px` }} />
      ))}
      {definition.outputs.map((port, index) => (
        <Handle key={port.id} type="source" position={Position.Right} id={port.id} style={{ top: `${34 + index * 24}px` }} />
      ))}
      <div className="canvas-card-head">
        <span className="node-icon">{definition.icon}</span>
        <div><b>{data.label}</b><small>{data.subtitle}</small></div>
        <span className={`node-status ${data.status}`}>{statusLabel[data.status]}</span>
      </div>
      {data.assetUrl ? (data.assetKind === 'video' ? <video className="node-asset-preview" src={data.assetUrl} controls /> : data.assetKind === 'audio' ? <audio className="node-asset-audio" src={data.assetUrl} controls /> : <img className="node-asset-preview" src={data.assetUrl} alt="" />) : null}
      <p>{data.body || '点击节点，在下方工作台继续编辑。'}</p>
      <div className="canvas-card-foot"><span>{data.status === 'failed' ? data.error : '输出端口 · ' + definition.outputs.map((port) => port.label).join(' / ')}</span><span className="node-menu">•••</span></div>
    </div>
  );
}
