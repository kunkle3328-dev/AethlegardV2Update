
import React, { useState, useEffect } from 'react';
import { Hexagon, ShieldAlert, Cpu, Network, Zap } from 'lucide-react';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isExiting, setIsExiting] = useState(false);

  const bootLogs = [
    "Establishing Neural Uplink...",
    "Querying Satellite Relay...",
    "Decrypting Cold Storage Vault...",
    "Synthesizing Aethelgard Core v3.1...",
    "Biometric Handshake Complete.",
    "Bypassing Sub-Space Latency...",
    "Aethelgard Ready."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(onComplete, 800);
          }, 500);
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 150);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    if (progress > 0) {
      const logIndex = Math.floor((progress / 100) * bootLogs.length);
      if (logIndex < bootLogs.length && (logs.length === 0 || logs[logs.length-1] !== bootLogs[logIndex])) {
        setLogs(prev => [...prev.slice(-3), bootLogs[logIndex]]);
      }
    }
  }, [progress]);

  return (
    <div className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center transition-all duration-1000 ${isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)]"></div>
        <div className="scanline"></div>
      </div>

      <div className="relative flex flex-col items-center gap-12 max-w-md w-full px-6">
        <div className="relative group">
          <div className="absolute -inset-8 bg-red-600/20 blur-3xl animate-pulse rounded-full"></div>
          <Hexagon className="w-32 h-32 text-red-600 fill-red-600/10 animate-float" strokeWidth={1} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
             <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
          </div>
        </div>

        <div className="space-y-4 text-center w-full">
          <h1 className="orbitron text-4xl font-black tracking-[0.2em] text-glow-red text-white uppercase">
            Aethelgard
          </h1>
          <div className="flex justify-center gap-6 text-zinc-600">
             <ShieldAlert className="w-4 h-4" />
             <Cpu className="w-4 h-4" />
             <Network className="w-4 h-4" />
             <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="w-full space-y-6">
          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-red-600 transition-all duration-300 ease-out relative" 
              style={{ width: `${progress}%` }}
            >
               <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-r from-transparent to-white/50 animate-progress"></div>
            </div>
          </div>
          
          <div className="h-16 overflow-hidden flex flex-col gap-1 items-center">
            {logs.map((log, i) => (
              <div key={i} className="orbitron text-[10px] text-red-500/60 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-1 duration-300">
                {log}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-12 orbitron text-[8px] text-zinc-800 tracking-[0.5em] uppercase">
          Neural Interface V3.1 // Research OS
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
