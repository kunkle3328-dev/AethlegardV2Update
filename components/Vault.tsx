
import React, { useState } from 'react';
import { Trash2, Calendar, ChevronRight, ArrowLeft, Bookmark, Volume2, VolumeX, Loader2, Play, Pause, Square, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { useVault } from '../hooks/useVault';
import { useAudioStore } from '../audio/audioStore';
import { audioController } from '../audio/audioController';
import { generateBriefingAudio } from '../audio/briefingSynth';
import { useAppStore } from '../stores/appStore';
import { VaultEntry } from '../schemas/vault.schema';

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Advanced helper for markdown-style formatting in Aethelgard reports
const formatContent = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return <div key={i} className="h-4" />;
    
    // Process markdown patterns: bold (**text**)
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const content = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const innerText = part.slice(2, -2);
        return <strong key={j} className="text-red-500 font-black tracking-tight">{innerText}</strong>;
      }
      return part;
    });

    return (
      <p key={i} className="mb-5 last:mb-0 leading-[1.8] tracking-wide text-zinc-300">
        {content}
      </p>
    );
  });
};

const Vault: React.FC = () => {
  const { items, deleteItem } = useVault();
  const { installedKits } = useAppStore();
  const { status, activeItemId, currentTime, duration, setStatus, setActiveItem } = useAudioStore();
  const [selectedItem, setSelectedItem] = useState<VaultEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAudioAction = async (item: VaultEntry) => {
    setError(null);
    if (activeItemId === item.id) {
      if (status === 'playing') audioController.pause();
      else if (status === 'paused') audioController.resume();
      return;
    }

    setStatus('synthesizing');
    setActiveItem(item.id);
    try {
      const audioUrl = await generateBriefingAudio(item.summary, item.content);
      if (audioUrl) {
        audioController.play(audioUrl, item.id, item.hash);
      } else {
        throw new Error("Failed to synthesize briefing.");
      }
    } catch (e) {
      console.error(e);
      setError("Briefing synthesis failed. Neural link timeout.");
      useAudioStore.getState().reset();
    }
  };

  const handleStop = () => {
    audioController.stop();
  };

  const isCurrent = (id: string) => activeItemId === id;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="max-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-16">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black orbitron uppercase">ARCHIVE <span className="text-zinc-700">VAULT</span></h1>
          <p className="text-zinc-500 text-xs orbitron tracking-widest uppercase mt-1">Total Records: {items.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-20 orbitron uppercase tracking-[0.5em]">Vault Depleted // No Intel Found</div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id} 
              className="glass-3d p-6 space-y-4 hover:border-red-600/30 transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
              onClick={() => setSelectedItem(item)}
            >
              {isCurrent(item.id) && status !== 'idle' && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-red-600 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
              )}
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-red-500 border border-white/5 shadow-inner"><Bookmark className="w-5 h-5" /></div>
                <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} className="p-2 text-zinc-700 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex-1">
                <h3 className="orbitron font-bold text-xs uppercase tracking-tight text-zinc-100 group-hover:text-red-600 transition-colors line-clamp-2">{item.summary}</h3>
                <p className="text-[10px] text-zinc-600 mt-2 line-clamp-3 leading-relaxed uppercase font-medium">{item.content.substring(0, 150)}</p>
              </div>
              <div className="flex justify-between items-center text-[8px] orbitron font-black text-zinc-700 uppercase pt-4 border-t border-white/5 mt-auto">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                <span className="group-hover:text-red-500 flex items-center gap-1 transition-colors">VIEW <ChevronRight className="w-3 h-3" /></span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}></div>
          <div className="relative w-full max-w-4xl glass-3d border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-5 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedItem(null)} className="p-3 glass-3d rounded-xl hover:text-red-500 transition-all shadow-md"><ArrowLeft className="w-5 h-5" /></button>
                <div className="max-w-xs md:max-w-md">
                  <h2 className="text-xl orbitron font-black text-zinc-100 uppercase tracking-tighter leading-tight">{selectedItem.summary}</h2>
                  <div className="flex flex-wrap gap-3 text-[8px] orbitron text-zinc-600 font-black uppercase tracking-widest mt-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-red-600" /> {new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-red-900" /> SECURED</span>
                  </div>
                </div>
              </div>

              {installedKits.includes('audio-synth') && (
                <div className="flex flex-col gap-4 w-full md:w-[320px] shrink-0">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAudioAction(selectedItem)}
                      className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl orbitron text-[10px] font-black transition-all shadow-xl active:scale-95 ${isCurrent(selectedItem.id) && status === 'playing' ? 'bg-red-600 text-white' : 'bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600/20'}`}
                    >
                      {status === 'synthesizing' && isCurrent(selectedItem.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                       (isCurrent(selectedItem.id) && status === 'playing') ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {status === 'synthesizing' && isCurrent(selectedItem.id) ? 'SYNTHESIZING...' : 
                       (isCurrent(selectedItem.id) && status === 'playing') ? 'PAUSE BRIEF' : 'NEURAL BRIEFING'}
                    </button>
                    {isCurrent(selectedItem.id) && status !== 'idle' && (
                      <button onClick={handleStop} className="p-3 bg-zinc-900 rounded-xl text-zinc-500 hover:text-red-500 transition-colors border border-white/5"><Square className="w-4 h-4" /></button>
                    )}
                  </div>
                  
                  {isCurrent(selectedItem.id) && status !== 'synthesizing' && status !== 'idle' && (
                    <div className="flex flex-col gap-2 px-1 animate-in fade-in slide-in-from-top-1">
                      <div className="flex justify-between text-[9px] orbitron text-zinc-500 font-black uppercase">
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-red-600" />
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
                      </div>
                    </div>
                  )}
                  
                  {isCurrent(selectedItem.id) && error && (
                    <div className="flex items-center gap-2 text-[8px] orbitron font-black text-red-500 uppercase animate-pulse px-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-5 md:p-10 custom-scrollbar">
              <div className="prose prose-invert max-w-none text-zinc-300 font-light text-base bg-white/[0.03] p-6 md:p-12 rounded-[2rem] border border-white/5 shadow-inner selection:bg-red-600/20">
                {formatContent(selectedItem.content)}
              </div>
            </div>
            <div className="p-4 border-t border-white/5 text-center bg-black/40">
              <span className="text-[8px] orbitron text-zinc-800 font-black tracking-[0.5em] uppercase">Authorized Access Only // Intel Terminated</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vault;
