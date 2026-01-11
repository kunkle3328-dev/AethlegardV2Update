
import React from 'react';
import { 
  Settings, 
  Volume2, 
  Timer, 
  Mic2, 
  ShieldCheck, 
  Zap, 
  Sliders, 
  BrainCircuit, 
  MessageSquare, 
  Headphones, 
  Sun, 
  Wind, 
  Music,
  Waves
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { 
  VoiceTone, 
  VoiceWarmth, 
  PauseStyle, 
  NoiseGateLevel,
  VoiceProfile 
} from '../types';

const SettingsStation: React.FC = () => {
  const { 
    voiceProfile, setVoiceProfile,
    backchannelEnabled, setBackchannelEnabled,
    conciergeMode, setConciergeMode,
    voiceConfig, setVoiceConfig
  } = useAppStore();

  const toneOptions: { id: VoiceTone; label: string; icon: any }[] = [
    { id: 'calm', label: 'Calm', icon: Wind },
    { id: 'neutral', label: 'Neutral', icon: Sliders },
    { id: 'expressive', label: 'Expressive', icon: Music }
  ];

  const warmthOptions: { id: VoiceWarmth; label: string; icon: any }[] = [
    { id: 'cool', label: 'Cool', icon: Wind },
    { id: 'natural', label: 'Natural', icon: Sun },
    { id: 'warm', label: 'Warm', icon: Waves }
  ];

  const pauseOptions: { id: PauseStyle; label: string; desc: string }[] = [
    { id: 'short', label: 'Short', desc: 'Efficient flow' },
    { id: 'natural', label: 'Natural', desc: 'Human breath' },
    { id: 'conversational', label: 'Spaced', desc: 'Thoughtful gaps' }
  ];

  const gateOptions: { id: NoiseGateLevel; label: string; desc: string }[] = [
    { id: 'low', label: 'Loose', desc: 'Studio environments' },
    { id: 'medium', label: 'Medium', desc: 'Standard noise' },
    { id: 'high', label: 'Strict', desc: 'Loud environments' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-10 animate-in fade-in duration-700 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl md:text-5xl font-black orbitron uppercase tracking-tighter">VOICE <span className="text-zinc-700">MATRIX</span></h1>
          <p className="text-zinc-500 orbitron text-[10px] tracking-widest uppercase mt-2">Neural Interface & Audio Stabilization</p>
        </div>
        <div className="p-3 glass-3d-red rounded-xl">
           <Sliders className="w-5 h-5 text-red-500" />
        </div>
      </div>

      <div className="space-y-12">
        {/* Core Persona */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <BrainCircuit className="w-5 h-5 text-red-600" />
            <h2 className="orbitron text-[10px] font-black uppercase tracking-[0.3em]">Neural Personality</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['calm', 'direct', 'curious'] as VoiceProfile[]).map((p) => (
              <button
                key={p}
                onClick={() => setVoiceProfile(p)}
                className={`p-6 glass-3d border text-left transition-all relative overflow-hidden group ${voiceProfile === p ? 'border-red-600/50 bg-red-600/5' : 'border-white/5 hover:border-white/20'}`}
              >
                {voiceProfile === p && <div className="absolute top-0 right-0 w-8 h-8 bg-red-600 flex items-center justify-center text-white"><Zap className="w-3 h-3" /></div>}
                <h3 className={`orbitron text-xs font-black uppercase mb-1 ${voiceProfile === p ? 'text-red-500' : 'text-zinc-100'}`}>{p}</h3>
                <p className="text-[9px] text-zinc-500 uppercase leading-tight">Neural weight: {p === 'calm' ? 'Measured' : p === 'direct' ? 'High Speed' : 'Exploratory'}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders for Speed and Warmth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 glass-3d p-8 border-white/5">
          <div className="space-y-4">
             <div className="flex justify-between items-center">
               <label className="orbitron text-[10px] font-black text-zinc-400 uppercase tracking-widest">Synthesis Speed</label>
               <span className="orbitron text-[10px] text-red-500 font-black">{voiceConfig.speed.toFixed(1)}x</span>
             </div>
             <input 
              type="range" min="0.8" max="1.2" step="0.05"
              value={voiceConfig.speed}
              onChange={(e) => setVoiceConfig({ speed: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-red-600"
             />
             <div className="flex justify-between text-[8px] orbitron text-zinc-600 font-black uppercase tracking-tighter">
                <span>Reflective</span>
                <span>Normal</span>
                <span>Rapid</span>
             </div>
          </div>

          <div className="space-y-4">
            <label className="orbitron text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vocal Warmth</label>
            <div className="flex gap-2">
              {warmthOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setVoiceConfig({ warmth: opt.id })}
                  className={`flex-1 p-4 glass-3d border flex flex-col items-center gap-2 transition-all ${voiceConfig.warmth === opt.id ? 'border-red-600/50 bg-red-600/10 text-white' : 'border-white/5 text-zinc-600'}`}
                >
                  <opt.icon className="w-4 h-4" />
                  <span className="orbitron text-[8px] font-black uppercase">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tone and Pauses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="orbitron text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-2">
              <Volume2 className="w-4 h-4" /> Synthesis Tone
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {toneOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setVoiceConfig({ tone: opt.id })}
                  className={`p-4 glass-3d border flex flex-col items-center gap-2 transition-all ${voiceConfig.tone === opt.id ? 'border-red-600/50 bg-red-600/10 text-white' : 'border-white/5 text-zinc-600'}`}
                >
                  <opt.icon className="w-4 h-4" />
                  <span className="orbitron text-[8px] font-black uppercase tracking-tighter">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="orbitron text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-2">
              <Timer className="w-4 h-4" /> Pacing Style
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {pauseOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setVoiceConfig({ pauseStyle: opt.id })}
                  className={`p-4 glass-3d border text-center transition-all ${voiceConfig.pauseStyle === opt.id ? 'border-red-600/50 bg-red-600/10 text-white' : 'border-white/5 text-zinc-600'}`}
                >
                  <span className="orbitron text-[8px] font-black uppercase block mb-1">{opt.label}</span>
                  <span className="text-[6px] uppercase opacity-60 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stabilization & Mic Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-3d p-6 border-white/5 space-y-4">
             <div className="flex items-center gap-2 text-zinc-400">
                <Mic2 className="w-4 h-4 text-red-600" />
                <h3 className="orbitron text-[10px] font-black uppercase tracking-widest">Input Noise Gate</h3>
             </div>
             <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
               {gateOptions.map(opt => (
                 <button
                   key={opt.id}
                   onClick={() => setVoiceConfig({ noiseGate: opt.id })}
                   className={`flex-1 py-2 rounded-lg orbitron text-[8px] font-black uppercase transition-all ${voiceConfig.noiseGate === opt.id ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-300'}`}
                 >
                   {opt.label}
                 </button>
               ))}
             </div>
             <p className="text-[7px] orbitron text-zinc-600 font-bold uppercase tracking-tight">Active Filter: High-Pass @ 80Hz // Force 48kHz</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => setBackchannelEnabled(!backchannelEnabled)}
              className={`p-6 w-full glass-3d border text-left transition-all flex items-center justify-between group ${backchannelEnabled ? 'border-red-600/40 bg-red-600/5' : 'border-white/5 opacity-60'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${backchannelEnabled ? 'bg-red-600/20 text-red-500' : 'bg-white/5 text-zinc-500'}`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="orbitron text-xs font-black uppercase text-zinc-100">Backchannel</h3>
                  <p className="text-[8px] orbitron text-zinc-600 font-bold uppercase mt-1">Spoken "mm/right" cues.</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${backchannelEnabled ? 'bg-red-600' : 'bg-zinc-800'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${backchannelEnabled ? 'left-6' : 'left-1'}`}></div>
              </div>
            </button>

            <button 
              onClick={() => setConciergeMode(!conciergeMode)}
              className={`p-6 w-full glass-3d border text-left transition-all flex items-center justify-between group ${conciergeMode ? 'border-red-600/40 bg-red-600/5' : 'border-white/5 opacity-60'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${conciergeMode ? 'bg-red-600/20 text-red-500' : 'bg-white/5 text-zinc-500'}`}>
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="orbitron text-xs font-black uppercase text-zinc-100">Concierge Flow</h3>
                  <p className="text-[8px] orbitron text-zinc-600 font-bold uppercase mt-1">Citation-free spoken logic.</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${conciergeMode ? 'bg-red-600' : 'bg-zinc-800'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${conciergeMode ? 'left-6' : 'left-1'}`}></div>
              </div>
            </button>
          </div>
        </div>

        <div className="p-8 glass-3d border-red-600/20 bg-red-600/[0.02] flex items-center gap-6 rounded-[2rem]">
           <div className="p-4 bg-red-600 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
             <ShieldCheck className="w-6 h-6 text-white" />
           </div>
           <div>
             <h4 className="orbitron text-xs font-black text-zinc-100 uppercase tracking-widest">Acoustic Stabilization Protocol</h4>
             <p className="text-[10px] text-zinc-500 uppercase mt-1 leading-relaxed">
               Mic static and pops are minimized via persistent 48kHz sampling and 80Hz high-pass filtering. 
               The noise gate prevents low-level background artifacts from triggering the neural uplink.
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsStation;
