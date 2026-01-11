
import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Save, 
  Sparkles, 
  CheckCircle2,
  Globe,
  Database,
  ArrowUpRight,
  ShieldCheck,
  Globe2,
  Newspaper,
  BookOpen,
  Calendar,
  WifiOff
} from 'lucide-react';
import { researchService } from '../services/researchService';
import { ResearchResult, ResearchMode, FreshnessLevel } from '../types';
import { useVault } from '../hooks/useVault';
import { useAppStore } from '../stores/appStore';

const formatContent = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return <div key={i} className="h-4" />;
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={i} className="mb-4 last:mb-0 leading-[1.8] text-zinc-300 text-sm md:text-base">
        {parts.map((part, j) => part.startsWith('**') && part.endsWith('**') ? <strong key={j} className="text-red-500 font-black">{part.slice(2, -2)}</strong> : part)}
      </p>
    );
  });
};

const ResearchStation: React.FC = () => {
  const { items, saveResearch } = useVault();
  const { cognitiveProfile, researchMode, setResearchMode, freshnessLevel, setFreshnessLevel, conciergeQuery, setConciergeQuery } = useAppStore();
  const [query, setQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [report, setReport] = useState<ResearchResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const performResearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsResearching(true);
    setSaveSuccess(false);
    
    // ⚠️ AI status intentionally ignored.
    // Search must always render live sources.
    try {
      const result = await researchService.performScan(searchQuery, items, cognitiveProfile, 'quick');
      setReport(result);
    } catch (err) { 
      console.warn("Scan synthesis failed, but UI renders sources.");
    } finally { 
      setIsResearching(false); 
    }
  };

  const handleResearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    performResearch(query);
  };

  useEffect(() => {
    if (conciergeQuery) {
      setQuery(conciergeQuery);
      performResearch(conciergeQuery);
      setConciergeQuery('');
    }
  }, [conciergeQuery]);

  const handleSave = async () => {
    if (!report || (!report.text && report.sources.length === 0)) return;
    try {
      const saveText = report.text || `SOURCE RECORD: ${report.sources.map(s => s.title).join(', ')}`;
      const res = await saveResearch(query, saveText, report.sources);
      if (res) setSaveSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-24 px-2">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
           <div className="px-4 py-1.5 rounded-full flex items-center gap-2 border glass-3d border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
              <span className="orbitron text-[9px] font-black tracking-widest uppercase text-zinc-500">
                LIVE SOURCES RETRIEVED // REVIEW NODES ON SIDEBAR
              </span>
           </div>
        </div>
        <h1 className="text-3xl md:text-6xl font-black orbitron uppercase leading-none tracking-tighter">
          NEURAL <span className="text-red-600 text-glow-red">SCAN</span>
        </h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <form onSubmit={handleResearchSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-2 p-2 glass-3d rounded-2xl md:rounded-full border-white/5 shadow-2xl relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query parameters..."
              className="flex-1 bg-transparent px-6 py-4 orbitron text-base md:text-lg focus:outline-none placeholder:text-zinc-800"
            />
            <button type="submit" disabled={isResearching} className="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-full font-black orbitron text-[10px] tracking-widest flex items-center gap-3 uppercase transition-all active:scale-95 disabled:opacity-50">
              {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isResearching ? 'SCANNING' : 'INITIATE'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="glass-3d p-4 border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-zinc-500">
                   <Globe className="w-3 h-3" />
                   <span className="orbitron text-[8px] font-black uppercase">Provider</span>
                </div>
                <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
                   {[
                     { id: 'web', icon: Globe2 },
                     { id: 'news', icon: Newspaper },
                     { id: 'academic', icon: BookOpen }
                   ].map(m => (
                     <button
                       key={m.id}
                       type="button"
                       onClick={() => setResearchMode(m.id as ResearchMode)}
                       className={`p-2 rounded-md transition-all ${researchMode === m.id ? 'bg-red-600 text-white' : 'text-zinc-600 hover:text-zinc-300'}`}
                     >
                       <m.icon className="w-4 h-4" />
                     </button>
                   ))}
                </div>
             </div>

             <div className="glass-3d p-4 border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-zinc-500">
                   <Calendar className="w-3 h-3" />
                   <span className="orbitron text-[8px] font-black uppercase">Pacing</span>
                </div>
                <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
                   {(['latest', 'recent', 'balanced', 'historical'] as FreshnessLevel[]).map(f => (
                     <button
                       key={f}
                       type="button"
                       onClick={() => setFreshnessLevel(f)}
                       className={`px-3 py-1 rounded-md orbitron text-[7px] font-black uppercase transition-all ${freshnessLevel === f ? 'bg-red-600 text-white' : 'text-zinc-600 hover:text-zinc-300'}`}
                     >
                       {f}
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </form>
      </div>

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in zoom-in-95 duration-500">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-3d p-6 md:p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden">
               <div className="flex justify-between items-center border-b border-white/5 pb-6 mb-8">
                  <h2 className="text-xl md:text-3xl orbitron font-black text-white uppercase tracking-tighter truncate max-w-full">{report.query}</h2>
                  {(report.text || report.sources.length > 0) && (
                    <button onClick={handleSave} disabled={saveSuccess} className={`flex items-center gap-2 px-6 py-3 rounded-xl orbitron text-[10px] font-black uppercase transition-all ${saveSuccess ? 'bg-green-600 text-white' : 'bg-zinc-100 hover:bg-white text-black'}`}>
                      {saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {saveSuccess ? 'ARCHIVED' : 'VAULT INTEL'}
                    </button>
                  )}
               </div>

               <div className="min-h-[150px] selection:bg-red-600/30">
                  {report.text ? (
                    formatContent(report.text)
                  ) : report.sources.length > 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-60 space-y-4">
                       <Database className="w-12 h-12 text-red-600" />
                       <p className="orbitron text-[10px] font-black uppercase tracking-widest text-center">Live sources retrieved // Synthesis skipped or pending</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30 space-y-4">
                       <WifiOff className="w-12 h-12" />
                       <p className="orbitron text-[10px] font-black uppercase tracking-widest">No Intelligence Found</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="glass-3d p-4 border-red-600/20 bg-red-600/5 flex items-center gap-4">
               <ShieldCheck className="w-6 h-6 text-red-600" />
               <p className="text-[10px] orbitron font-bold text-zinc-300 uppercase tracking-tight">
                  Verification Protocol: Node reliability ensured through provider-first retrieval architecture.
               </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-3d p-6 md:p-8 rounded-[2rem] border-white/5 space-y-6">
               <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2 text-red-500">
                    <Globe className="w-4 h-4" />
                    <h3 className="orbitron text-[10px] font-black uppercase tracking-widest">Grounded Nodes</h3>
                  </div>
                  <span className="text-[9px] orbitron text-zinc-600 font-bold">{report.sources.length} SOURCES</span>
               </div>

               <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                  {report.sources.length === 0 ? (
                    <div className="py-20 text-center space-y-3 opacity-20">
                      <WifiOff className="w-8 h-8 mx-auto" />
                      <p className="orbitron text-[8px] font-black uppercase tracking-widest">No Sources Linked</p>
                    </div>
                  ) : (
                    report.sources.map((source, i) => (
                      <div key={i} className="group glass-3d border-white/5 rounded-2xl hover:border-red-600/30 transition-all hover:bg-white/[0.02] p-4 relative">
                        <div className="flex justify-between items-start gap-2 mb-2">
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="orbitron text-[10px] font-black text-zinc-100 uppercase group-hover:text-red-500 transition-colors line-clamp-1 flex-1">
                              {source.title}
                            </a>
                            <ArrowUpRight className="w-3 h-3 text-zinc-700 group-hover:text-red-500 shrink-0" />
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 uppercase italic mb-3">{source.snippet}</p>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchStation;
