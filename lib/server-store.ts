import type { AssetRecord, CanvasDocument, ModelConfig, RunStatus } from './canvas/types';
import { DEFAULT_MODELS } from './canvas/registry';

type ProviderRecord = {
  id: string;
  name: string;
  protocol: 'openai' | 'gemini' | 'native';
  baseUrl: string;
  apiKey: string;
  hidden: boolean;
  models: ModelConfig[];
};

type ProjectRecord = { id: string; title: string; canvas: CanvasDocument; createdAt: string; updatedAt: string };

type Store = { projects: Map<string, ProjectRecord>; assets: Map<string, AssetRecord>; runs: Map<string, RunStatus>; providers: Map<string, ProviderRecord>; defaults: { models: ModelConfig[]; concurrency: { text: number; image: number; video: number; audio: number } } };

const globalStore = globalThis as typeof globalThis & { __wuxianStore?: Store };
export const store: Store = globalStore.__wuxianStore ?? (globalStore.__wuxianStore = {
  projects: new Map(), assets: new Map(), runs: new Map(),
  providers: new Map([
    ['openrouter', { id: 'openrouter', name: 'OpenRouter', protocol: 'native', baseUrl: 'https://openrouter.ai/api/v1', apiKey: '', hidden: false, models: DEFAULT_MODELS.filter((model) => model.provider === 'OpenRouter') }],
    ['mimo', { id: 'mimo', name: '小米 MiMo', protocol: 'native', baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1', apiKey: '', hidden: false, models: DEFAULT_MODELS.filter((model) => model.provider === '小米 MiMo') }],
    ['compatible', { id: 'compatible', name: 'OpenAI / Gemini Compatible', protocol: 'openai', baseUrl: '', apiKey: '', hidden: false, models: DEFAULT_MODELS.filter((model) => model.id.includes('compatible')) }],
  ]),
  defaults: { models: DEFAULT_MODELS, concurrency: { text: 5, image: 5, video: 5, audio: 5 } },
});

export function newProject(title = '未命名工作区') {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const canvas: CanvasDocument = { id: crypto.randomUUID(), projectId: id, title, version: 1, viewport: { x: 0, y: 0, zoom: 0.85 }, nodes: [], edges: [], updatedAt: now };
  const project = { id, title, canvas, createdAt: now, updatedAt: now };
  store.projects.set(id, project);
  return project;
}

export function ensureProject(id?: string) {
  if (id && store.projects.has(id)) return store.projects.get(id)!;
  return newProject();
}

export function safeProvider(provider: ProviderRecord) {
  return { ...provider, apiKey: provider.apiKey ? '••••••••••••••••' : '' };
}

export type { ProjectRecord, ProviderRecord };
