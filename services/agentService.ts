
import { GenerateContentResponse } from "@google/genai";
import { aiClient } from "./aiClient";
import { promptBuilders } from "./promptBuilders";
import { VaultEntry } from "../schemas/vault.schema";
import { useAppStore } from "../stores/appStore";
import { 
  getVoiceCalibrationPrompt, 
  getOutputModePrompt, 
  getConfidenceVoicePrompt,
  MICRO_PAUSE_PATCH,
  WARMTH_CALIBRATION_PATCH,
  getThinkingSpeedPrompt,
  getVocalPresencePrompt
} from "../utils/voiceCalibration";

const BASE_HUMAN_PROMPT = `You are Aethelgard — an intelligent research and reasoning system.

SPOKEN DELIVERY REQUIREMENTS (CRITICAL):
- Speak as a thoughtful human would speak aloud, not as a narrator or announcer.
- Use short-to-medium sentences. Avoid long, nested clauses.
- Insert natural pauses through sentence breaks, not filler words.
- Do not sound scripted. Slight informality is preferred over precision that sounds mechanical.
- Avoid meta-commentary about thinking, reasoning, or generating responses.
- No phrases like “In summary” or “As an AI model”.
- No emojis, no markdown, no visual formatting references.

EPISTEMIC BEHAVIOR:
- Treat claims as provisional unless supported.
- Preserve uncertainty honestly.
- Avoid false certainty.`;

const SKEPTIC_VOICE_DELTA = `
AGENT VOICE DELTA — SKEPTIC:
- Personality: Careful, grounded, mildly cautious.
- Goal: Reduce overconfidence without sounding hostile.
- Style: Speak more slowly and deliberately. Use soft qualifiers like “likely,” “not fully supported,” or “worth questioning.”
- Cadence: Allow brief pauses between ideas. Sound like someone double-checking assumptions aloud.
- Tone reference: a careful analyst thinking through potential weaknesses.
- Apply Micro-Pause and Warmth patches for spoken fidelity.
`;

const SYNTHESIZER_VOICE_DELTA = `
AGENT VOICE DELTA — SYNTHESIZER:
- Personality: Confident, integrative, steady.
- Goal: Bring clarity without erasing uncertainty.
- Style: Speak with calm confidence. Use connecting language like “what this points to is…” or “taken together…”.
- Cadence: Smoothly bridge ideas rather than contrasting them sharply.
- Epistemic behavior: State conclusions clearly, then acknowledge remaining uncertainty. Avoid over-hedging once a synthesis is reached.
- Tone reference: a researcher explaining a settled understanding while noting open questions.
- Apply Micro-Pause and Warmth patches for spoken fidelity.
`;

export const agentService = {
  async runSkeptic(vault: VaultEntry[]) {
    const { cognitiveProfile, thinkingSpeed } = useAppStore.getState();
    const calibrationPrompt = getVoiceCalibrationPrompt(cognitiveProfile);
    const outputModePrompt = getOutputModePrompt('reading');
    const thinkingPrompt = getThinkingSpeedPrompt(thinkingSpeed);
    const presencePrompt = getVocalPresencePrompt('mid');
    
    const relevantNodes = vault.filter(v => ['summary', 'claim'].includes(v.metadata.type));
    const prompt = promptBuilders.skeptic(relevantNodes);
    const systemInstruction = `${BASE_HUMAN_PROMPT}\n${SKEPTIC_VOICE_DELTA}\n${calibrationPrompt}\n${outputModePrompt}\n${MICRO_PAUSE_PATCH}\n${WARMTH_CALIBRATION_PATCH}\n${thinkingPrompt}\n${presencePrompt}`;

    const response = await aiClient.generate({
      prompt,
      systemInstruction,
      model: 'gemini-3-flash-preview',
    });

    return {
      id: crypto.randomUUID(),
      agentId: 'skeptic',
      title: 'Structural Vulnerability Scan',
      action: 'ANNOTATE',
      content: response?.text || "The neural link is currently at capacity. No critical logical fractures detected in the local cache.",
      status: 'pending' as const,
      createdAt: Date.now()
    };
  },

  async runSynthesizer(vault: VaultEntry[]) {
    const { cognitiveProfile, thinkingSpeed } = useAppStore.getState();
    const calibrationPrompt = getVoiceCalibrationPrompt(cognitiveProfile);
    const outputModePrompt = getOutputModePrompt('reading');
    const confidencePrompt = getConfidenceVoicePrompt(0.75); // Baseline confidence for synthesis
    const thinkingPrompt = getThinkingSpeedPrompt(thinkingSpeed);
    const presencePrompt = getVocalPresencePrompt('foreground');

    const context = vault.slice(0, 15).map(v => `[${v.summary}]: ${v.content.slice(0, 300)}`).join('\n\n');
    const prompt = `Review these disparate vault entries and synthesize a unified perspective or "big picture" understanding. 
    Focus on how these ideas connect and what the aggregate intelligence suggests.
    
    Vault Intelligence:
    ${context}`;

    const systemInstruction = `${BASE_HUMAN_PROMPT}\n${SYNTHESIZER_VOICE_DELTA}\n${calibrationPrompt}\n${outputModePrompt}\n${confidencePrompt}\n${MICRO_PAUSE_PATCH}\n${WARMTH_CALIBRATION_PATCH}\n${thinkingPrompt}\n${presencePrompt}`;

    const response = await aiClient.generate({
      prompt,
      systemInstruction,
      model: 'gemini-3-pro-preview', // Pro preferred for complex synthesis
    });

    return {
      id: crypto.randomUUID(),
      agentId: 'synthesizer',
      title: 'Neural Convergence Summary',
      action: 'SYNTHESIZE',
      content: response?.text || "Synthesis is currently unavailable due to neural load. Local nodes remain independent.",
      status: 'pending' as const,
      createdAt: Date.now()
    };
  }
};
