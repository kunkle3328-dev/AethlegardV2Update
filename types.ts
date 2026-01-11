
export interface VaultItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  sourceUrls: { uri: string; title: string }[];
  timestamp: number;
  tags: string[];
  workspaceId: string;
}

export interface Workspace {
  id: string;
  name: string;
  color: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  RESEARCH = 'RESEARCH',
  VAULT = 'VAULT',
  GRAPH = 'GRAPH',
  KITS = 'KITS',
  DEBATE = 'DEBATE',
  AGENTS = 'AGENTS',
  ONBOARDING = 'ONBOARDING',
  PRICING = 'PRICING',
  SETTINGS = 'SETTINGS'
}

export type ScanMode = 'quick' | 'deep';
export type ResearchMode = 'web' | 'news' | 'academic';
export type FreshnessLevel = 'latest' | 'recent' | 'balanced' | 'historical';

// Enhanced Voice Configuration
export type VoiceTone = 'calm' | 'neutral' | 'expressive';
export type VoiceWarmth = 'cool' | 'natural' | 'warm';
export type PauseStyle = 'short' | 'natural' | 'conversational';
export type NoiseGateLevel = 'low' | 'medium' | 'high';
export type VoiceProfile = 'calm' | 'direct' | 'curious';

export interface VoiceConfig {
  tone: VoiceTone;
  speed: number;
  warmth: VoiceWarmth;
  pauseStyle: PauseStyle;
  noiseGate: NoiseGateLevel;
}

export interface MatrixSettings {
  gpuAcceleration: boolean;
  graphDbV5: boolean;
  nlpOverride: boolean;
}

export interface Agent {
  id: string;
  name: string;
  type: 'Academic' | 'Market' | 'Synthesizer' | 'Advocate' | 'Briefing';
  status: 'Active' | 'Idle' | 'Scanning';
  lastRun?: number;
  description: string;
  tier: Tier;
}

export type Tier = 'Explorer' | 'Researcher' | 'Strategist' | 'Architect';

export interface DebateParticipant {
  name: string;
  persona: string;
  voice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
}

export interface CognitiveProfile {
  reasoningPriority: 'evidence' | 'consensus' | 'novelty' | 'skeptical';
  uncertaintyTolerance: 'low' | 'medium' | 'high';
  domainFocus: string[];
}

export type ThinkingSpeed = 'slow' | 'measured' | 'fast';
export type VoiceStyle = 'natural' | 'crisp' | 'calm';
export type ListeningSensitivity = 'normal' | 'reduced' | 'high';
export type MicState = 'idle' | 'listening' | 'error';
export type AudioState = 'idle' | 'listening' | 'processing' | 'speaking';

// AudioPlaybackState supports playback tracking for briefings and debates
export interface AudioPlaybackState {
  status: 'idle' | 'synthesizing' | 'playing' | 'paused';
  progress: number;
  activeItemId?: string;
}

export interface SourceResult {
  title: string;
  uri: string;
  snippet: string;
  published?: string;
  source: 'web' | 'vault' | 'internal' | 'news' | 'academic';
  score?: number;
  explanation?: string[];
}

export interface ResearchResult {
  text: string | null;
  sources: SourceResult[];
  mode: 'live' | 'internal' | 'local' | 'cached' | 'raw';
  status: 'optimal' | 'degraded' | 'restricted' | 'offline';
  query: string;
}
