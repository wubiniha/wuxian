import type { Edge, Node, Viewport } from '@xyflow/react';

export type CanvasNodeType = 'text' | 'image' | 'video' | 'audio' | 'asset';
export type CanvasNodeStatus = 'idle' | 'queued' | 'running' | 'success' | 'failed';
export type AssetKind = 'image' | 'video' | 'audio';

export type ModelCapability = {
  aspectRatios?: string[];
  resolutions?: string[];
  durations?: number[];
  counts?: number[];
  audio?: boolean;
  modes?: string[];
  languages?: string[];
  sampleRates?: number[];
  formats?: string[];
};

export type ModelConfig = {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  type: 'text' | 'image' | 'video' | 'audio';
  enabled: boolean;
  capability?: ModelCapability;
};

export type CanvasNodeData = {
  label: string;
  subtitle: string;
  type: CanvasNodeType;
  body: string;
  status: CanvasNodeStatus;
  accent: string;
  config: Record<string, unknown>;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  assetId?: string;
  assetUrl?: string;
  assetKind?: AssetKind;
  error?: string;
  [key: string]: unknown;
};

export type CanvasNode = Node<CanvasNodeData, CanvasNodeType>;
export type CanvasEdge = Edge;

export type CanvasDocument = {
  id: string;
  projectId: string;
  title: string;
  version: number;
  viewport: Viewport;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  updatedAt: string;
};

export type AssetRecord = {
  id: string;
  name: string;
  kind: AssetKind;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
};

export type RunStatus = {
  id: string;
  nodeId: string;
  status: CanvasNodeStatus;
  provider?: string;
  model?: string;
  output?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
};
