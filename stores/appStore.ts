
import { create } from 'zustand';
import { 
  AppView, 
  CognitiveProfile, 
  ThinkingSpeed, 
  VoiceStyle, 
  ListeningSensitivity, 
  ResearchMode, 
  FreshnessLevel, 
  MatrixSettings, 
  VoiceProfile,
  VoiceConfig
} from '../types';

interface AppStore {
  view: AppView;
  voiceProfile: VoiceProfile;
  voiceStyle: VoiceStyle;
  thinkingSpeed: ThinkingSpeed;
  listeningSensitivity: ListeningSensitivity;
  researchMode: ResearchMode;
  freshnessLevel: FreshnessLevel;
  backchannelEnabled: boolean;
  conciergeMode: boolean;
  installedKits: string[];
  cognitiveProfile: CognitiveProfile | null;
  conciergeQuery: string;
  matrixSettings: MatrixSettings;
  voiceConfig: VoiceConfig;
  
  setView: (view: AppView) => void;
  setVoiceProfile: (profile: VoiceProfile) => void;
  setVoiceStyle: (style: VoiceStyle) => void;
  setThinkingSpeed: (speed: ThinkingSpeed) => void;
  setListeningSensitivity: (sensitivity: ListeningSensitivity) => void;
  setResearchMode: (mode: ResearchMode) => void;
  setFreshnessLevel: (level: FreshnessLevel) => void;
  setBackchannelEnabled: (enabled: boolean) => void;
  setConciergeMode: (enabled: boolean) => void;
  setConciergeQuery: (query: string) => void;
  toggleKit: (id: string) => void;
  setCognitiveProfile: (profile: CognitiveProfile) => void;
  toggleMatrixSetting: (key: keyof MatrixSettings) => void;
  setVoiceConfig: (config: Partial<VoiceConfig>) => void;
}

const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  tone: 'neutral',
  speed: 1.0,
  warmth: 'natural',
  pauseStyle: 'natural',
  noiseGate: 'medium'
};

export const useAppStore = create<AppStore>((set) => ({
  view: AppView.DASHBOARD,
  voiceProfile: (localStorage.getItem('aethel_voice_profile') as VoiceProfile) || 'calm',
  voiceStyle: (localStorage.getItem('aethel_voice_style') as VoiceStyle) || 'natural',
  thinkingSpeed: (localStorage.getItem('aethel_thinking_speed') as ThinkingSpeed) || 'measured',
  listeningSensitivity: (localStorage.getItem('aethel_listening_sensitivity') as ListeningSensitivity) || 'reduced',
  researchMode: (localStorage.getItem('aethel_research_mode') as ResearchMode) || 'web',
  freshnessLevel: (localStorage.getItem('aethel_freshness') as FreshnessLevel) || 'balanced',
  backchannelEnabled: localStorage.getItem('aethel_backchannel') !== 'false',
  conciergeMode: localStorage.getItem('aethel_concierge_mode') === 'true',
  installedKits: JSON.parse(localStorage.getItem('aethel_kits') || '["semantic-pro"]'),
  cognitiveProfile: JSON.parse(localStorage.getItem('aethel_cognitive_profile') || 'null'),
  conciergeQuery: '',
  matrixSettings: JSON.parse(localStorage.getItem('aethel_matrix') || '{"gpuAcceleration": false, "graphDbV5": false, "nlpOverride": false}'),
  voiceConfig: JSON.parse(localStorage.getItem('aethel_voice_config') || JSON.stringify(DEFAULT_VOICE_CONFIG)),

  setView: (view) => set({ view }),
  setVoiceProfile: (profile) => set(() => {
    localStorage.setItem('aethel_voice_profile', profile);
    return { voiceProfile: profile };
  }),
  setVoiceStyle: (style) => set(() => {
    localStorage.setItem('aethel_voice_style', style);
    return { voiceStyle: style };
  }),
  setThinkingSpeed: (speed) => set(() => {
    localStorage.setItem('aethel_thinking_speed', speed);
    return { thinkingSpeed: speed };
  }),
  setListeningSensitivity: (sensitivity) => set(() => {
    localStorage.setItem('aethel_listening_sensitivity', sensitivity);
    return { listeningSensitivity: sensitivity };
  }),
  setResearchMode: (mode) => set(() => {
    localStorage.setItem('aethel_research_mode', mode);
    return { researchMode: mode };
  }),
  setFreshnessLevel: (level) => set(() => {
    localStorage.setItem('aethel_freshness', level);
    return { freshnessLevel: level };
  }),
  setBackchannelEnabled: (enabled) => set(() => {
    localStorage.setItem('aethel_backchannel', enabled.toString());
    return { backchannelEnabled: enabled };
  }),
  setConciergeMode: (enabled) => set(() => {
    localStorage.setItem('aethel_concierge_mode', enabled.toString());
    return { conciergeMode: enabled };
  }),
  setConciergeQuery: (query) => set({ conciergeQuery: query }),
  toggleKit: (id) => set((state) => {
    const next = state.installedKits.includes(id) 
      ? state.installedKits.filter(k => k !== id) 
      : [...state.installedKits, id];
    localStorage.setItem('aethel_kits', JSON.stringify(next));
    return { installedKits: next };
  }),
  setCognitiveProfile: (profile) => set(() => {
    localStorage.setItem('aethel_cognitive_profile', JSON.stringify(profile));
    return { cognitiveProfile: profile };
  }),
  toggleMatrixSetting: (key) => set((state) => {
    const next = { ...state.matrixSettings, [key]: !state.matrixSettings[key] };
    localStorage.setItem('aethel_matrix', JSON.stringify(next));
    return { matrixSettings: next };
  }),
  setVoiceConfig: (newConfig) => set((state) => {
    const next = { ...state.voiceConfig, ...newConfig };
    localStorage.setItem('aethel_voice_config', JSON.stringify(next));
    return { voiceConfig: next };
  }),
}));
