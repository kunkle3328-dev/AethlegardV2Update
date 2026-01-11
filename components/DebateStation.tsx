
import React, { useState } from 'react';
import { Mic2, Play, Pause, Square, Loader2, Users, Sparkles, BrainCircuit, MessageSquare, Clock, AlertCircle, ZapOff } from 'lucide-react';
import { generateSyntheticDebate } from '../audio/debateSynth';
import { audioController } from '../audio/audioController';
import { useAudioStore } from '../audio/audioStore';
import { DebateParticipant } from '../types';
import { DebatePersona, DebateTurn } from '../schemas/debate.schema';

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const DebateStation: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [debateLog, setDebateLog] = useState<DebateTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { status, activeItemId, currentTime, duration } = useAudioStore();

  const personas: DebatePersona[] = [
    { id: '1', name: 'Analyst', role: 'optimist', persona: 'Pragmatic, data-driven researcher', voice: 'Kore', prompt: 'Focus on feasibility and immediate gains.' },
    { id: '2', name: 'Skeptic', role: 'skeptic', persona: 'Philosophical, critical deep-thinker', voice: 'Puck', prompt: 'Question assumptions and long-term ethical debt.' },
  ];

  const handleStartDebate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setDebateLog([]);
    setError(null);
    try {
      const url = await generateSyntheticDebate(topic, personas[0], personas[1]);
      if (url) {
        audioController.play(url, 'debate-main');
        setDebateLog([
          { personaId: '1', name: 'Analyst', content: `The data suggests ${topic} is inevitable...`, timestamp: Date.now() },
          { personaId: '2', name: 'Skeptic', content: "But at what cost to neural integrity?", timestamp: Date.now() + 1000 }
        ]);
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED')) {
        setError("Neural capacity exceeded. Debate engines at quota limit. Try again shortly.");
      } else {
        setError("Synthesis interrupted. Matrix link unstable.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePlayback = () => {
    if (status === 'playing') audioController.pause();
    else if (status === 'paused') audioController.resume();
  };

  const isCurrent = activeItemId === 'debate-main';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in duration-700 pb-24">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black orbitron uppercase tracking-tighter">
          SYNTHETIC <span className="text-red-600">DEBATE</span>
        </h1>
        <p className="text-zinc-500 orbitron text-[10px] tracking-widest uppercase">Structured Multi-Speaker Argumentation</p>
      </div>

      <div className="glass-3d p-8 space-y-8 rounded-[2rem] relative overflow-hidden">
        {/* Playback indicator background */}
        {isCurrent && status !== 'idle' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900/50">
            <div 
              className="h-full bg-red-600 transition-all duration-300" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        )}

        <div className="flex gap-4 items-center justify-center pt-4">
          <div className="flex -space-x-4">
             {personas.map(p => (
               <div key={p.id} className={`w-16 h-16 rounded-full glass-3d-red border-2 flex items-center justify-center text-red-500 bg-black relative group transition-all duration-500 ${isCurrent && status === 'playing' ? 'border-red-600 scale-110 shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'border-zinc-800'}`}>
                 <BrainCircuit className={`w-8 h-8 ${isCurrent && status === 'playing' ? 'animate-pulse' : ''}`} />
                 <div className="absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 p-2 rounded text-[8px] orbitron whitespace-nowrap z-10 uppercase">
                    {p.name}: {p.role}
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="space-y-6 max-w-2xl mx-auto text-center">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Input debate parameters (e.g. 'Ethical implications of local vector stores')"
            className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 orbitron text-center text-lg focus:outline-none focus:border-red-600/50 transition-all resize-none h-32 selection:bg-red-600/30 placeholder:text-zinc-800"
          />
          
          <div className="flex flex-col gap-6">
            <div className="flex justify-center gap-4">
               <button 
                 onClick={handleStartDebate}
                 disabled={isGenerating || (isCurrent && status === 'playing')}
                 className="bg-red-600 hover:bg-red-500 text-white px-12 py-4 rounded-xl font-black orbitron text-[10px] tracking-[0.2em] uppercase transition-all shadow-2xl flex items-center gap-2 disabled:opacity-50 active:scale-95"
               >
                 {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                 {isGenerating ? 'ORCHESTRATING PERSONAS...' : 'INITIALIZE ARGUMENT'}
               </button>

               {isCurrent && status !== 'idle' && (
                 <div className="flex gap-2">
                   <button 
                    onClick={handleTogglePlayback}
                    className="p-4 glass-3d border border-red-600/20 text-red-500 hover:bg-red-600/10 rounded-xl transition-all"
                   >
                     {status === 'playing' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                   </button>
                   <button 
                    onClick={() => audioController.stop()} 
                    className="p-4 bg-zinc-900 rounded-xl text-zinc-500 hover:text-red-500 border border-white/5"
                   >
                     <Square className="w-5 h-5" />
                   </button>
                 </div>
               )}
            </div>

            {error && (
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-orange-600/10 border border-orange-500/20 text-orange-400 flex items-center gap-3 animate-in fade-in zoom-in-95">
                <ZapOff className="w-5 h-5 shrink-0" />
                <span className="orbitron text-[9px] font-black uppercase text-left">{error}</span>
              </div>
            )}

            {/* Enhanced Playback Controls */}
            {isCurrent && status !== 'idle' && (
              <div className="max-w-md mx-auto w-full space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center text-[10px] orbitron font-black text-zinc-500 uppercase px-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-red-600" />
                    <span>{formatTime(currentTime)}</span>
                  </div>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="relative group/seek">
                  <input 
                    type="range" 
                    min="0" 
                    max={duration || 0} 
                    step="0.1"
                    value={currentTime} 
                    onChange={(e) => audioController.seek(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-red-600"
                  />
                  <div className="absolute -top-1 left-0 h-3 w-3 bg-red-600 rounded-full shadow-lg opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none" style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {debateLog.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2 px-2">
            <MessageSquare className="w-4 h-4 text-red-600" />
            <span className="orbitron text-[9px] font-black text-zinc-500 uppercase tracking-widest">Transcript Stream</span>
          </div>
          {debateLog.map((turn, i) => (
            <div key={i} className={`p-6 glass-3d border-l-4 transition-all duration-500 ${turn.personaId === '1' ? 'border-red-600 bg-red-600/[0.02]' : 'border-zinc-700 bg-zinc-900/[0.2]'} hover:border-white/20`}>
              <div className="orbitron text-[8px] font-black mb-1 uppercase tracking-tighter flex justify-between">
                <span className={turn.personaId === '1' ? 'text-red-500' : 'text-zinc-400'}>{turn.name}</span>
                <span className="text-zinc-700">{new Date(turn.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed uppercase">{turn.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebateStation;
