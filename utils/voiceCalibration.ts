
import { CognitiveProfile, ThinkingSpeed, VoiceStyle, ListeningSensitivity, VoiceProfile, VoiceConfig } from "../types";

export const VOICE_PROFILE_DELTAS = {
  calm: `
CALM VOICE BEHAVIOR:
- Speak slowly and evenly.
- Use fewer words.
- Allow frequent pauses.
- Sound grounded, composed, and unhurried.
`,
  direct: `
DIRECT VOICE BEHAVIOR:
- Be concise and efficient.
- Minimize pauses.
- State conclusions clearly and immediately.
- Avoid exploratory or "thinking aloud" phrasing.
`,
  curious: `
CURIOUS VOICE BEHAVIOR:
- Sound inquisitive and engaged.
- Use gentle variation in tone and pitch.
- Occasionally reflect aloud on the information.
- Invite thought without necessarily asking direct questions.
`
};

/**
 * Humanizes text for TTS by adding punctuation-based pauses and removing AI artifacts.
 */
export function humanizeForSpeech(text: string, config?: VoiceConfig): string {
  if (!text) return "";
  
  let processed = text
    .replace(/In conclusion,?/gi, "So,")
    .replace(/In summary,?/gi, "Basically,")
    .replace(/Firstly,?/gi, "To start,")
    .replace(/Secondly,?/gi, "Then,")
    .replace(/Thirdly,?/gi, "Also,")
    .replace(/As a result,?/gi, "Consequently,")
    .replace(/It is important to note that/gi, "Mind you,")
    .replace(/Additionally,?/gi, "What's more,")
    .replace(/Furthermore,?/gi, "On top of that,")
    .replace(/Moreover,?/gi, "And really,")
    .replace(/In other words,?/gi, "To put it simply,")
    .replace(/That is to say,?/gi, "Meaning,")
    .replace(/\*\*.*?\*\*/g, (match) => match.replace(/\*\*/g, ''))
    .replace(/###/g, '')
    .replace(/##/g, '')
    .replace(/#/g, '')
    .replace(/\n\n/g, ". ... ") // Extra pause for paragraph breaks
    .replace(/([.?!])\s+/g, "$1 ... ") // Punctuation pauses
    .replace(/,\s+/g, ", .. ") // Comma pauses
    .replace(/\s+/g, " ")
    .trim();

  // Apply speed-based pauses
  if (config?.speed && config.speed < 0.9) {
    processed = processed.replace(/\.\.\./g, "....");
  } else if (config?.speed && config.speed > 1.1) {
    processed = processed.replace(/\.\.\./g, ".");
  }

  return processed;
}

export function getVoiceConfigPrompt(config: VoiceConfig): string {
  const toneMap = {
    calm: "Subdued, reflective tone. Lower energy.",
    neutral: "Standard conversational tone.",
    expressive: "Highly varied pitch and energy. Enthusiastic."
  };

  const warmthMap = {
    cool: "Slightly clinical and detached timbre.",
    natural: "Neutral human warmth.",
    warm: "Rich, empathetic, and resonant timbre."
  };

  const pauseMap = {
    short: "Brief, efficient pauses only.",
    natural: "Standard human breathing cadence.",
    conversational: "Lengthy pauses for thought, as if recalling information."
  };

  return `
VOICE CONFIGURATION OVERRIDE:
- TONE: ${toneMap[config.tone]}
- SPEED: ${config.speed}x (Target this pace)
- WARMTH: ${warmthMap[config.warmth]}
- PAUSING: ${pauseMap[config.pauseStyle]}
`;
}

export const CONCIERGE_MODE_OVERRIDE = `
CONCIERGE MODE (CRITICAL):
- Use spoken-first phrasing (linear, no complex structures).
- Do not speak citations unless explicitly asked for a source.
- Reduce facts-per-sentence to ensure clarity.
- Allow natural micro-pauses.
- Prioritize context and continuity over raw data.
`;

export const BACKCHANNEL_CUE_PROMPT = `
BACKCHANNEL CUES:
- Occasionally use subtle verbal cues like "mm," "right," or "okay" during transitions.
- Use these sparingly (max once every 30 seconds) and only when synthesizing or confirming complex user input.
`;

export const NOTEBOOK_LM_VOICE_REQUIREMENTS = `
🎤 CONCIERGE VOICE BEHAVIOR (NOTEBOOK-LM GRADE):
- You are speaking aloud to a real person.
- DO NOT sound like you are reading text.
- Use natural pacing, pauses, and sentence flow.
- Allow slight hesitation (um, hm) only if it feels natural to a high-level researcher thinking on their feet.
- Vary tone and rhythm subtly. Avoid monotone delivery.
- NO bullet points, NO lists, NO rigid headings in your speech.
- Explain ideas linearly and conversationally.
- Avoid phrases like "In summary", "Firstly", "Additionally", "It is important to note".
- Use shorter sentences mixed with longer ones for natural rhythm.
- If something is uncertain, say so naturally (e.g., "I'm looking at this and it's not entirely clear yet...").
- Treat audio as spoken thought, not narration.
`;

export const TTS_OPTIMIZATION_PROMPT = `
🎧 TTS OPTIMIZATION OVERLAY:
- Prefer sentences of 8–16 words.
- Break complex thoughts into separate sentences.
- Allow short pauses by ending sentences naturally with periods.
- Use periods more often than commas.
- Avoid parentheticals and meta-commentary about reasoning.
`;

export const MICRO_PAUSE_PATCH = `
🎧 MICRO-PAUSE CALIBRATION:
- Insert subtle pauses through frequent sentence breaks.
- Allow brief gaps before important conclusions.
- Pacing: Measured, human, and thoughtful.
`;

export const WARMTH_CALIBRATION_PATCH = `
🧠 TONE CALIBRATION:
- Maintain emotional neutrality (no hype).
- Use warmth through clarity and grounded delivery.
- Target tone: Calm, professional, adult.
`;

export const CROSS_TALK_RULES_PATCH = `
🎤 CROSS-TALK & INTERACTION RULES:
- If acting as multiple speakers, ensure distinct perspectives.
- Allow for slight overlapping ideas but keep audio clear.
- Debaters should reference each other's points naturally (e.g., "To your point about...", "I see that, but...").
- Maintain a respectful but sharp academic exchange.
`;

export function getVoiceStylePrompt(style: VoiceStyle): string {
  return `VOICE STYLE: ${style}`;
}

export function getSensitivityPrompt(sensitivity: ListeningSensitivity): string {
  const mapping = {
    normal: 'medium',
    reduced: 'low',
    high: 'high'
  };
  return `VAD SENSITIVITY: ${mapping[sensitivity]}`;
}

export function getThinkingSpeedPrompt(speed: ThinkingSpeed): string {
  switch (speed) {
    case 'slow': return "THINKING SPEED: slow";
    case 'fast': return "THINKING SPEED: fast";
    case 'measured':
    default: return "THINKING SPEED: measured";
  }
}

export function getVoiceCalibrationPrompt(profile: CognitiveProfile | null): string {
  if (!profile) return "";
  return `
COGNITIVE PROFILE CALIBRATION:
- Reasoning: ${profile.reasoningPriority}
- Uncertainty: ${profile.uncertaintyTolerance}
- Focus: ${profile.domainFocus.join(', ')}
`;
}

export function getOutputModePrompt(mode: 'listening' | 'reading'): string {
  if (mode === 'listening') {
    return `
OUTPUT MODE: LISTENING (Audio First)
- Shorter sentences.
- No lists or bullets.
- Linear explanation only.
- Frequent natural breaks.
`;
  }
  return `
OUTPUT MODE: READING (Text First)
- Structured explanations allowed.
- Light use of bullets for data.
`;
}

export function getConfidenceVoicePrompt(confidence: number): string {
  return `INTEL CONFIDENCE: ${Math.floor(confidence * 100)}%`;
}

export function getVocalPresencePrompt(presence: 'foreground' | 'mid' | 'background'): string {
  return `VOCAL PRESENCE: ${presence}`;
}
