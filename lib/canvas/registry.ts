import type { CanvasNodeData, CanvasNodeType, ModelConfig } from './types';

export type Port = { id: string; label: string; accepts: string[]; emits: string };
export type NodeDefinition = {
  type: CanvasNodeType;
  label: string;
  subtitle: string;
  icon: string;
  accent: string;
  inputs: Port[];
  outputs: Port[];
  defaultConfig: Record<string, unknown>;
};

export const NODE_DEFINITIONS: Record<CanvasNodeType, NodeDefinition> = {
  text: {
    type: 'text', label: '文字', subtitle: 'TEXT / PROMPT', icon: 'T', accent: '#e1a84a',
    inputs: [{ id: 'prompt', label: '提示词', accepts: ['text'], emits: 'text' }],
    outputs: [{ id: 'text', label: '文字', accepts: [], emits: 'text' }],
    defaultConfig: { mode: '文本生成', modelId: 'text::compatible', system: '', maxTokens: 1200, temperature: 0.7 },
  },
  image: {
    type: 'image', label: '图片', subtitle: 'IMAGE / GENERATE', icon: '▧', accent: '#4d9de0',
    inputs: [{ id: 'reference', label: '参考图', accepts: ['image', 'asset'], emits: 'image' }, { id: 'prompt', label: '提示词', accepts: ['text'], emits: 'text' }],
    outputs: [{ id: 'image', label: '图片', accepts: [], emits: 'image' }],
    defaultConfig: { mode: '图生图', modelId: 'image::compatible', aspectRatio: '16:9', resolution: '2K', count: 1 },
  },
  video: {
    type: 'video', label: '视频', subtitle: 'VIDEO / GENERATE', icon: '▶', accent: '#38b883',
    inputs: [{ id: 'reference', label: '参考素材', accepts: ['image', 'video', 'asset'], emits: 'media' }, { id: 'prompt', label: '提示词', accepts: ['text'], emits: 'text' }],
    outputs: [{ id: 'video', label: '视频', accepts: [], emits: 'video' }],
    defaultConfig: { mode: '全能参考', modelId: 'openrouter::bytedance/seedance-2.5', aspectRatio: '16:9', resolution: '720p', duration: 5, generateAudio: true, count: 1 },
  },
  audio: {
    type: 'audio', label: '语音', subtitle: 'AUDIO / TTS', icon: '♫', accent: '#c979d9',
    inputs: [{ id: 'text', label: '文字', accepts: ['text'], emits: 'text' }, { id: 'reference', label: '音色参考', accepts: ['audio', 'asset'], emits: 'audio' }],
    outputs: [{ id: 'audio', label: '音频', accepts: [], emits: 'audio' }],
    defaultConfig: { mode: '文本转语音', modelId: 'mimo::mimo-v2.5-tts', language: '中文', voice: '默认音色', sampleRate: 24000, format: 'wav', speed: 1, pitch: 0, volume: 1 },
  },
  asset: {
    type: 'asset', label: '资产引用', subtitle: 'ASSET / REFERENCE', icon: '◈', accent: '#8a78ed',
    inputs: [],
    outputs: [{ id: 'asset', label: '资产', accepts: [], emits: 'asset' }],
    defaultConfig: {},
  },
};

export const VIDEO_MODELS: ModelConfig[] = [
  { id: 'openrouter::bytedance/seedance-2.5', name: 'Seedance 2.5', provider: 'OpenRouter', modelId: 'bytedance/seedance-2.5', type: 'video', enabled: true, capability: { aspectRatios: ['Auto', '16:9', '4:3', '1:1', '3:4', '9:16', '21:9'], resolutions: ['480p', '720p', '1080p'], durations: [5, 10, 15, 20, 30], counts: [1, 2, 4], audio: true, modes: ['全能参考', '图生视频', '首尾帧'] } },
  { id: 'openrouter::alibaba/wan-3.0', name: 'Wan 3.0', provider: 'OpenRouter', modelId: 'alibaba/wan-3.0', type: 'video', enabled: true, capability: { aspectRatios: ['Auto', '16:9', '9:16', '1:1'], resolutions: ['480p', '720p', '1080p'], durations: [3, 5, 10], counts: [1, 2, 4], audio: true, modes: ['全能参考', '图生视频'] } },
  { id: 'openrouter::bytedance/seedance-2.0-mini', name: 'Seedance 2.0 Mini', provider: 'OpenRouter', modelId: 'bytedance/seedance-2.0-mini', type: 'video', enabled: true, capability: { aspectRatios: ['Auto', '16:9', '9:16', '1:1'], resolutions: ['480p', '720p'], durations: [5, 10], counts: [1, 2, 4], audio: true, modes: ['全能参考', '图生视频'] } },
];

export const DEFAULT_MODELS: ModelConfig[] = [
  ...VIDEO_MODELS,
  { id: 'mimo::mimo-v2.5-tts', name: 'MiMo V2.5 TTS', provider: '小米 MiMo', modelId: 'mimo-v2.5-tts', type: 'audio', enabled: true, capability: { languages: ['中文', 'English'], sampleRates: [16000, 24000], formats: ['wav', 'mp3'] } },
  { id: 'mimo::mimo-v2.5-tts-voicedesign', name: 'MiMo Voice Design', provider: '小米 MiMo', modelId: 'mimo-v2.5-tts-voicedesign', type: 'audio', enabled: true, capability: { languages: ['中文', 'English'], sampleRates: [24000], formats: ['wav', 'mp3'] } },
  { id: 'mimo::mimo-v2.5-tts-voiceclone', name: 'MiMo Voice Clone', provider: '小米 MiMo', modelId: 'mimo-v2.5-tts-voiceclone', type: 'audio', enabled: true, capability: { languages: ['中文', 'English'], sampleRates: [24000], formats: ['wav', 'mp3'] } },
  { id: 'text::compatible', name: '兼容层文字模型', provider: 'OpenAI / Gemini Compatible', modelId: 'your-text-model', type: 'text', enabled: true },
  { id: 'image::compatible', name: '兼容层图片模型', provider: 'OpenAI / Gemini Compatible', modelId: 'your-image-model', type: 'image', enabled: true, capability: { aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'], resolutions: ['1K', '2K'], counts: [1, 2, 4] } },
];

const outputMap: Record<CanvasNodeType, string[]> = { text: ['text'], image: ['image'], video: ['video'], audio: ['audio'], asset: ['asset', 'image', 'video', 'audio'] };

export function isValidConnection(source: CanvasNodeData, target: CanvasNodeData, targetHandle?: string | null) {
  if (source.type === 'asset') return true;
  const definition = NODE_DEFINITIONS[target.type];
  const port = definition.inputs.find((item) => item.id === targetHandle) ?? definition.inputs[0];
  if (!port) return false;
  return port.accepts.some((accepted) => outputMap[source.type].includes(accepted));
}

