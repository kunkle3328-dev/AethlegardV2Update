
import { useAudioStore } from '../stores/audioStore';

class AudioController {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private buffer: AudioBuffer | null = null;
  private startTime: number = 0;
  private offset: number = 0;
  private isPaused: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass({ sampleRate: 24000 });
    }
    return this.ctx;
  }

  async play(base64Data: string) {
    this.stop();
    const ctx = this.initCtx();
    const bytes = this.decodeBase64(base64Data);
    this.buffer = await this.decodeAudioData(bytes, ctx, 24000, 1);
    this.startFrom(0);
  }

  private startFrom(offset: number) {
    if (!this.ctx || !this.buffer) return;
    
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.ctx.destination);
    
    this.source.onended = () => {
      if (!this.isPaused) {
        useAudioStore.getState().reset();
        this.offset = 0;
      }
    };

    this.startTime = this.ctx.currentTime - offset;
    this.source.start(0, offset);
    this.isPaused = false;
    useAudioStore.getState().setStatus('playing');
  }

  pause() {
    if (this.source && this.ctx && !this.isPaused) {
      this.isPaused = true;
      this.offset = this.ctx.currentTime - this.startTime;
      this.source.stop();
      this.source = null;
      useAudioStore.getState().setStatus('paused');
    }
  }

  resume() {
    if (this.isPaused && this.buffer) {
      this.startFrom(this.offset);
    }
  }

  stop() {
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
    this.buffer = null;
    this.offset = 0;
    this.isPaused = false;
    useAudioStore.getState().reset();
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
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
}

export const audioController = new AudioController();
