
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Mic, MicOff, X, Activity } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { useAudioStore } from '../audio/audioStore';
import { MicState, AudioState, AppView } from '../types';
import { 
  getVoiceCalibrationPrompt, 
  getOutputModePrompt, 
  TTS_OPTIMIZATION_PROMPT,
  MICRO_PAUSE_PATCH,
  WARMTH_CALIBRATION_PATCH,
  getThinkingSpeedPrompt,
  getVoiceStylePrompt,
  getSensitivityPrompt,
  NOTEBOOK_LM_VOICE_REQUIREMENTS,
  humanizeForSpeech,
  VOICE_PROFILE_DELTAS,
  CONCIERGE_MODE_OVERRIDE,
  BACKCHANNEL_CUE_PROMPT,
  getVoiceConfigPrompt
} from '../utils/voiceCalibration';

const SAMPLE_RATE = 48000; // Force 48kHz for high fidelity and stability
const NOISE_GATE_THRESHOLDS = {
  low: 0.002,
  medium: 0.005,
  high: 0.01
};
const MAX_SILENCE_DURATION = 3000;

const researchTool: FunctionDeclaration = {
  name: 'research_topic',
  parameters: {
    type: Type.OBJECT,
    description: 'Triggers research for a specific topic.',
    properties: { topic: { type: Type.STRING } },
    required: ['topic']
  }
};

const SPOKEN_SYSTEM_PROMPT = `You are Aethelgard. A sophisticated research concierge.`;

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 32768 : s * 32767;
  }
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveConcierge: React.FC = () => {
  const { 
    setView, voiceStyle, cognitiveProfile, thinkingSpeed, 
    listeningSensitivity, setConciergeQuery, voiceProfile, 
    backchannelEnabled, conciergeMode, voiceConfig
  } = useAppStore();
  
  const briefingStatus = useAudioStore((state) => state.status);
  
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [micState, setMicState] = useState<MicState>('idle');
  const [transcription, setTranscription] = useState<string[]>([]);
  const [lastVolume, setLastVolume] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const isSessionActiveRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const activeOutputCountRef = useRef(0);
  const silenceStartRef = useRef<number | null>(null);

  // Persistence: Ensure single persistent AudioContext
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
    }
    return audioContextRef.current;
  };

  const stopAllSpeech = () => {
    for (const s of sourcesRef.current) {
      try { s.stop(); } catch (e) {}
    }
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    activeOutputCountRef.current = 0;
    if (audioState === 'speaking') setAudioState('listening');
  };

  const stopSession = async () => {
    isSessionActiveRef.current = false;
    activeOutputCountRef.current = 0;
    if (sessionRef.current) { 
      try { sessionRef.current.close(); } catch(e) {} 
      sessionRef.current = null; 
    }
    if (scriptProcessorRef.current) { 
      scriptProcessorRef.current.onaudioprocess = null; 
      scriptProcessorRef.current.disconnect(); 
      scriptProcessorRef.current = null; 
    }
    for (const s of sourcesRef.current) {
      try { s.stop(); } catch (e) {}
    }
    sourcesRef.current.clear();
    if (streamRef.current) { 
      streamRef.current.getTracks().forEach(track => track.stop()); 
      streamRef.current = null; 
    }
    setAudioState('idle'); 
    setMicState('idle'); 
    nextStartTimeRef.current = 0; 
    setLastVolume(0); 
    setFeedback(null);
  };

  const startSession = async () => {
    if (audioState !== 'idle') { await stopSession(); return; }
    if (briefingStatus !== 'idle') useAudioStore.getState().reset();

    setAudioState('listening'); 
    setMicState('listening'); 
    setFeedback("Initializing Link...");
    silenceStartRef.current = Date.now();

    try {
      const audioCtx = getAudioContext();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } 
      });
      streamRef.current = stream;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const calibrationPrompt = getVoiceCalibrationPrompt(cognitiveProfile);
      const thinkingPrompt = getThinkingSpeedPrompt(thinkingSpeed);
      const stylePrompt = getVoiceStylePrompt(voiceStyle);
      const sensitivityPrompt = getSensitivityPrompt(listeningSensitivity);
      const profilePrompt = VOICE_PROFILE_DELTAS[voiceProfile];
      const backchannelPrompt = backchannelEnabled ? BACKCHANNEL_CUE_PROMPT : "";
      const conciergePrompt = conciergeMode ? CONCIERGE_MODE_OVERRIDE : "";
      const voiceConfigPrompt = getVoiceConfigPrompt(voiceConfig);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            isSessionActiveRef.current = true; 
            setFeedback("Link Established @ 48kHz");
            
            const source = audioCtx.createMediaStreamSource(stream);
            
            // FILTERS: High-Pass @ 80Hz to kill low-end rumble/static
            const hpf = audioCtx.createBiquadFilter();
            hpf.type = "highpass";
            hpf.frequency.value = 80;

            const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!isSessionActiveRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              
              // NOISE GATE: Volume calculation for automatic processing state
              let sum = 0; 
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setLastVolume(rms);
              
              const gateThreshold = NOISE_GATE_THRESHOLDS[voiceConfig.noiseGate];
              const gateOpen = rms > gateThreshold;

              const now = Date.now();
              if (activeOutputCountRef.current === 0) {
                if (gateOpen) silenceStartRef.current = now;
                if (silenceStartRef.current && (now - silenceStartRef.current > MAX_SILENCE_DURATION)) {
                  setAudioState('processing');
                }
              } else {
                // INTERRUPTIBILITY: User voice triggers cutoff
                if (rms > 0.05) { 
                  stopAllSpeech();
                }
              }

              // Apply Noise Gate: Prevent pops/static when silent
              if (!gateOpen) inputData.fill(0);

              // Don't send feedback loop if AI is speaking
              if (activeOutputCountRef.current > 0) inputData.fill(0);
              
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(s => { 
                if (s && isSessionActiveRef.current) s.sendRealtimeInput({ media: pcmBlob }); 
              });
            };
            
            source.connect(hpf);
            hpf.connect(scriptProcessor); 
            scriptProcessor.connect(audioCtx.destination);
          },
          onmessage: async (msg) => {
            silenceStartRef.current = Date.now(); 
            if (msg.toolCall) {
              setAudioState('processing'); 
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'research_topic') {
                  const topic = (fc.args as any).topic;
                  if (topic) {
                    setConciergeQuery(topic);
                    setView(AppView.RESEARCH);
                  }
                }
                sessionPromise.then(s => s.sendToolResponse({ 
                  functionResponses: { id: fc.id, name: fc.name, response: { result: "Task triggered." } } 
                }));
              }
            }
            const base64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64 && audioCtx) {
              setAudioState('speaking'); 
              setFeedback(null);
              if (audioCtx.state === 'suspended') await audioCtx.resume();
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
              
              const buffer = await decodeAudioData(decode(base64), audioCtx, 24000, 1);
              const sourceNode = audioCtx.createBufferSource(); 
              sourceNode.buffer = buffer; 
              sourceNode.connect(audioCtx.destination);
              sourceNode.onended = () => {
                sourcesRef.current.delete(sourceNode);
                activeOutputCountRef.current = Math.max(0, activeOutputCountRef.current - 1);
                if (activeOutputCountRef.current === 0 && isSessionActiveRef.current) {
                   setAudioState('listening'); 
                   setFeedback("Listening..."); 
                   silenceStartRef.current = Date.now();
                }
              };
              activeOutputCountRef.current++; 
              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration; 
              sourcesRef.current.add(sourceNode);
            }
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              if (text) {
                const humanized = humanizeForSpeech(text, voiceConfig);
                setTranscription(prev => [...prev.slice(-3), humanized]);
              }
            }
            if (msg.serverContent?.interrupted) stopAllSpeech();
          },
          onclose: () => stopSession(),
          onerror: (e) => { 
            console.error("Session Error:", e);
            setMicState('error'); 
            setFeedback("Link Failure"); 
            setTimeout(stopSession, 2000); 
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [researchTool] }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `${SPOKEN_SYSTEM_PROMPT}\n${NOTEBOOK_LM_VOICE_REQUIREMENTS}\n${profilePrompt}\n${conciergePrompt}\n${backchannelPrompt}\n${calibrationPrompt}\n${getOutputModePrompt('listening')}\n${TTS_OPTIMIZATION_PROMPT}\n${MICRO_PAUSE_PATCH}\n${WARMTH_CALIBRATION_PATCH}\n${thinkingPrompt}\n${stylePrompt}\n${sensitivityPrompt}\n${voiceConfigPrompt}`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      setMicState('error'); setFeedback("Handshake Failed"); setTimeout(stopSession, 3000);
    }
  };

  return (
    <div className="fixed bottom-32 md:bottom-24 right-6 md:right-8 z-[60] flex flex-col items-end gap-4 pointer-events-none">
      {audioState !== 'idle' && (
        <div className={`glass-3d-red p-4 md:p-6 rounded-[2rem] w-[calc(100vw-3rem)] md:w-80 mb-2 pointer-events-auto border transition-all duration-500 shadow-2xl animate-in slide-in-from-bottom-4 ${micState === 'error' ? 'border-orange-500/50' : 'border-red-600/30'}`}>
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${audioState === 'speaking' ? 'bg-red-500' : audioState === 'processing' ? 'bg-white' : 'bg-zinc-600'}`}></div>
                <span className={`orbitron text-[7px] font-black uppercase tracking-widest ${audioState === 'speaking' ? 'text-red-500' : 'text-zinc-500'}`}>{audioState.toUpperCase()}</span>
             </div>
             <button onClick={stopSession} className="text-zinc-600 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
          {feedback && <div className="mb-4 flex items-center gap-2 text-zinc-400 text-[8px] orbitron font-black uppercase tracking-widest"><Activity className="w-3 h-3 text-red-500" /> {feedback}</div>}
          <div className="space-y-2 h-16 overflow-hidden flex flex-col justify-end">
             {transcription.map((t, i) => <p key={i} className="text-[9px] orbitron text-zinc-300 uppercase leading-tight font-bold opacity-80 animate-in fade-in slide-in-from-bottom-1">{t}</p>)}
          </div>
        </div>
      )}
      <button 
        onClick={audioState !== 'idle' ? () => { stopAllSpeech(); stopSession(); } : startSession} 
        className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl pointer-events-auto group relative ${audioState !== 'idle' ? 'bg-red-600 text-white shadow-red-600/40' : 'glass-3d text-zinc-400 hover:text-red-500 hover:border-red-600/30'}`}
      >
        {audioState !== 'idle' ? <MicOff className="w-5 h-5 md:w-6 md:h-6 animate-in zoom-in-75" /> : <Mic className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />}
      </button>
    </div>
  );
};

export default LiveConcierge;
