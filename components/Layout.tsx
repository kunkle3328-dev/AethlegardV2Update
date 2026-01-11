
import React from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Database, 
  Network, 
  Settings, 
  Cpu,
  Hexagon,
  Command,
  BrainCircuit,
  Zap,
  Sliders
} from 'lucide-react';
import { AppView } from '../types';
import LiveConcierge from './LiveConcierge';
import { useAppStore } from '../stores/appStore';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView }) => {
  const navItems = [
    { id: AppView.DASHBOARD, icon: LayoutDashboard, label: 'CORE' },
    { id: AppView.RESEARCH, icon: Search, label: 'SCAN' },
    { id: AppView.VAULT, icon: Database, label: 'ARCHIVE' },
    { id: AppView.DEBATE, icon: BrainCircuit, label: 'DEBATE' },
    { id: AppView.AGENTS, icon: Zap, label: 'AGENTS' },
    { id: AppView.SETTINGS, icon: Sliders, label: 'VOICE' },
  ];

  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden font-inter selection:bg-red-600/30 relative">
      <LiveConcierge />
      
      {/* Sidebar - Desktop */}
      <nav className="hidden md:flex flex-col w-20 lg:w-64 border-r border-white/5 glass-3d items-center lg:items-start py-8 px-4 gap-8 z-20 m-3 rounded-[2.5rem]">
        <div className="flex items-center gap-3 px-2 group cursor-pointer" onClick={() => setActiveView(AppView.DASHBOARD)}>
          <div className="relative">
            <Hexagon className="w-10 h-10 text-red-600 fill-red-600/10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-red-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div className="hidden lg:block">
            <span className="orbitron font-black text-lg tracking-[0.1em] text-glow-red text-red-600 uppercase">Aethel</span>
            <div className="text-[7px] orbitron tracking-[0.2em] text-zinc-500 -mt-1 font-bold uppercase">Research Engine</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full overflow-y-auto custom-scrollbar pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative overflow-hidden active:scale-95 ${
                  isActive 
                  ? 'glass-3d-red text-red-500 shadow-[0_4px_24px_rgba(220,38,38,0.15)] border-red-600/20' 
                  : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2 : 1.5} />
                <span className="hidden lg:block font-black orbitron tracking-[0.2em] text-[9px] uppercase">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-3 w-full pt-6 border-t border-white/5">
          <button className="flex items-center gap-4 p-4 rounded-2xl text-zinc-600 hover:text-red-500 hover:bg-white/5 transition-all">
            <Command className="w-5 h-5" strokeWidth={1.5} />
            <span className="hidden lg:block orbitron text-[8px] tracking-widest font-black uppercase">Shortcuts</span>
          </button>
          
          <div className="p-5 glass-3d border border-white/5 rounded-3xl hidden lg:block bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-3 h-3 text-red-600 animate-spin-slow" />
                <span className="text-[7px] font-black orbitron text-red-500 tracking-tighter uppercase">Linkage</span>
              </div>
              <span className="text-[7px] orbitron text-zinc-600 font-black">98.2%</span>
            </div>
            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-red-600 w-full opacity-60"></div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-black/40 backdrop-blur-xl z-10 md:hidden shrink-0">
            <div className="flex items-center gap-2" onClick={() => setActiveView(AppView.DASHBOARD)}>
              <Hexagon className="w-5 h-5 text-red-600" />
              <span className="orbitron font-black text-[10px] text-red-600 tracking-widest uppercase">Aethelgard</span>
            </div>
            <div className="p-1.5 glass-3d-red rounded-lg">
              <Cpu className="w-3.5 h-3.5 text-red-500" />
            </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-16 md:py-12 custom-scrollbar pb-24 md:pb-12">
          {children}
        </div>

        {/* Mobile Navigation Dock */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom,0.75rem)] pt-2 px-4 bg-black/90 backdrop-blur-2xl border-t border-white/5 z-50">
          <nav className="glass-3d h-14 flex items-center justify-between px-1 border-white/10 shadow-2xl relative">
              {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                      <button
                          key={item.id}
                          onClick={() => setActiveView(item.id)}
                          className={`flex flex-col items-center justify-center transition-all duration-300 rounded-xl active:scale-90 flex-1 h-full relative ${isActive ? 'text-red-500' : 'text-zinc-500'}`}
                      >
                          <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-red-600/10' : ''}`}>
                            <Icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''}`} />
                          </div>
                          <span className={`text-[6px] orbitron tracking-tight font-black mt-0.5 transition-all ${isActive ? 'opacity-100 scale-100' : 'opacity-60 scale-95'}`}>
                            {item.label}
                          </span>
                          {isActive && (
                            <div className="absolute -bottom-1 w-6 h-0.5 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse"></div>
                          )}
                      </button>
                  );
              })}
          </nav>
        </div>
      </main>
    </div>
  );
};

export default Layout;
